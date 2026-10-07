package com.himani.parkspot_backend.scheduler;

import com.himani.parkspot_backend.model.Session;
import com.himani.parkspot_backend.model.SessionStatus;
import com.himani.parkspot_backend.repository.SessionRepository;
import com.himani.parkspot_backend.service.SessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class SessionReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionReminderScheduler.class);

    private final SessionRepository sessionRepository;
    private final SessionService sessionService;

    public SessionReminderScheduler(SessionRepository sessionRepository, SessionService sessionService) {
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
    }

    @Scheduled(fixedRate = 60000)
    public void checkSessions() {
        Instant now = Instant.now();

        // 1) cancel bookings nobody paid for within 5 minutes
        for (Session s : sessionRepository.findByStatusAndCreatedAtBefore(
                SessionStatus.PENDING_PAYMENT, now.minus(Duration.ofMinutes(5)))) {
            sessionService.cancelPending(s);
        }

        // 2) 5-minute reminders for active sessions
        for (Session s : sessionRepository.findByStatusAndReminderSentFalseAndEndTimeBefore(
                SessionStatus.ACTIVE, now.plus(Duration.ofMinutes(5)))) {
            log.info("Reminder: session {} ends in less than 5 minutes", s.getId());
            s.setReminderSent(true);
            sessionRepository.save(s);
        }

        // 3) expire active sessions whose time is up
        for (Session s : sessionRepository.findByStatusAndEndTimeBefore(SessionStatus.ACTIVE, now)) {
            sessionService.endSession(s);
        }
    }
}