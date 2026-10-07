package com.himani.parkspot_backend.service;

import com.himani.parkspot_backend.exception.AlreadyParkedException;
import com.himani.parkspot_backend.exception.BadRequestException;
import com.himani.parkspot_backend.exception.InvalidDurationException;
import com.himani.parkspot_backend.exception.PaymentException;
import com.himani.parkspot_backend.exception.ZoneFullException;
import com.himani.parkspot_backend.model.BookingPreview;
import com.himani.parkspot_backend.model.BookingRequest;
import com.himani.parkspot_backend.model.ParkResponse;
import com.himani.parkspot_backend.model.Session;
import com.himani.parkspot_backend.model.SessionStatus;
import com.himani.parkspot_backend.model.Zone;
import com.himani.parkspot_backend.repository.SessionRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);
    private static final int MIN_MINUTES = 10;
    private static final int MAX_MINUTES = 240;
    private static final long RATE_CENTS_PER_MINUTE = 10;

    private final SessionRepository sessionRepository;
    private final ZoneService zoneService;
    private final PaymentService paymentService;

    public SessionService(SessionRepository sessionRepository, ZoneService zoneService, PaymentService paymentService) {
        this.sessionRepository = sessionRepository;
        this.zoneService = zoneService;
        this.paymentService = paymentService;
    }

    private record Checked(Zone zone, String plate, String state) {}

    // Every rule that must hold before a spot is shown or held
    private Checked validate(String userId, BookingRequest req) {
        if (req == null || req.zoneId() == null || req.zoneId().isBlank()) {
            throw new BadRequestException("Choose a parking location");
        }
        int minutes = req.durationMinutes();
        if (minutes < MIN_MINUTES) {
            throw new InvalidDurationException("Minimum parking duration is " + MIN_MINUTES + " minutes");
        }
        if (minutes > MAX_MINUTES) {
            throw new InvalidDurationException("Maximum parking duration is " + MAX_MINUTES + " minutes");
        }

        String plate = normalizePlate(req.plate());
        String state = normalizeState(req.plateState());

        // the typed number must match the clicked address
        Zone zone = zoneService.verifyCode(userId, req.zoneId(), req.zoneCode());

        Instant now = Instant.now();
        if (sessionRepository.existsByUserIdAndStatus(userId, SessionStatus.PENDING_PAYMENT)
                || sessionRepository.existsByUserIdAndStatusAndEndTimeAfter(userId, SessionStatus.ACTIVE, now)) {
            throw new AlreadyParkedException("You already have an active parking session");
        }
        if (sessionRepository.existsByPlateAndPlateStateAndStatus(plate, state, SessionStatus.PENDING_PAYMENT)
                || sessionRepository.existsByPlateAndPlateStateAndStatusAndEndTimeAfter(
                plate, state, SessionStatus.ACTIVE, now)) {
            throw new AlreadyParkedException("This plate already has an active booking");
        }
        return new Checked(zone, plate, state);
    }

    // Step 1: "Continue". Checks everything, holds nothing, charges nothing.
    public BookingPreview preview(String userId, BookingRequest req) {
        Checked c = validate(userId, req);
        Zone zone = c.zone();

        int spotsLeft = zone.getCapacity() - zone.getCurrentCount();
        if (spotsLeft <= 0) {
            throw new ZoneFullException("No spots available at this location");
        }
        return new BookingPreview(zone.getId(), zone.getName(), spotsLeft, zone.getCapacity(),
                c.plate(), c.state(), req.durationMinutes(), (long) req.durationMinutes() * RATE_CENTS_PER_MINUTE);
    }

    // Step 2: "Confirm & pay". Re-checks everything, then holds the spot and creates the PaymentIntent.
    public ParkResponse book(String userId, BookingRequest req) {
        Checked c = validate(userId, req);

        zoneService.holdSpot(c.zone().getId());   // atomic; throws ZoneFullException if the last spot just went

        Session session = new Session();
        session.setUserId(userId);
        session.setZoneId(c.zone().getId());
        session.setZoneName(c.zone().getName());
        session.setPlate(c.plate());
        session.setPlateState(c.state());
        session.setStatus(SessionStatus.PENDING_PAYMENT);
        session.setDurationMinutes(req.durationMinutes());
        session.setCostCents((long) req.durationMinutes() * RATE_CENTS_PER_MINUTE);
        session.setCreatedAt(Instant.now());
        session = sessionRepository.save(session);

        try {
            PaymentIntent intent = paymentService.createIntent(session);
            session.setPaymentIntentId(intent.getId());
            sessionRepository.save(session);
            return new ParkResponse(session, intent.getClientSecret());
        } catch (StripeException e) {
            log.error("Stripe error creating PaymentIntent", e);
            cancelPending(session);
            throw new PaymentException("Payment service unavailable, please try again");
        }
    }

    public void onPaymentSucceeded(String paymentIntentId) {
        Optional<Session> found = sessionRepository.findByPaymentIntentId(paymentIntentId);
        if (found.isEmpty()) {
            log.warn("No session for PaymentIntent {}", paymentIntentId);
            return;
        }
        Session session = found.get();
        switch (session.getStatus()) {
            case PENDING_PAYMENT -> activate(session);
            case CANCELLED -> paymentService.refund(paymentIntentId);
            default -> { }
        }
    }

    private void activate(Session session) {
        Instant now = Instant.now();
        session.setStatus(SessionStatus.ACTIVE);
        session.setStartTime(now);
        session.setEndTime(now.plus(Duration.ofMinutes(session.getDurationMinutes())));
        sessionRepository.save(session);
    }

    public void endSession(Session session) {
        if (session.getStatus() != SessionStatus.ACTIVE) {
            return;
        }
        Instant now = Instant.now();
        session.setStatus(SessionStatus.ENDED);
        session.setEndedAt(now.isAfter(session.getEndTime()) ? session.getEndTime() : now);
        sessionRepository.save(session);
        zoneService.releaseSpot(session.getZoneId());
    }

    public void cancelPending(Session session) {
        if (session.getStatus() != SessionStatus.PENDING_PAYMENT) {
            return;
        }
        session.setStatus(SessionStatus.CANCELLED);
        sessionRepository.save(session);
        zoneService.releaseSpot(session.getZoneId());
        if (session.getPaymentIntentId() != null) {
            paymentService.cancelIntent(session.getPaymentIntentId());
        }
    }

    private static String normalizePlate(String raw) {
        String plate = raw == null ? "" : raw.toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (plate.length() < 2 || plate.length() > 8) {
            throw new BadRequestException("Enter a valid license plate");
        }
        return plate;
    }

    private static String normalizeState(String raw) {
        String state = raw == null ? "" : raw.trim().toUpperCase();
        if (!state.matches("[A-Z]{2}")) {
            throw new BadRequestException("Choose the plate's state");
        }
        return state;
    }
}