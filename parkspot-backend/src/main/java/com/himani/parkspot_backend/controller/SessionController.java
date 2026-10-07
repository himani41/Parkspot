package com.himani.parkspot_backend.controller;

import com.himani.parkspot_backend.exception.NotFoundException;
import com.himani.parkspot_backend.exception.UnauthorizedException;
import com.himani.parkspot_backend.model.Session;
import com.himani.parkspot_backend.model.SessionStatus;
import com.himani.parkspot_backend.repository.SessionRepository;
import com.himani.parkspot_backend.service.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final SessionRepository sessionRepository;
    private final SessionService sessionService;

    public SessionController(SessionRepository sessionRepository, SessionService sessionService) {
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
    }

    // The user's current ACTIVE session, or else a PENDING_PAYMENT one, or 204
    @GetMapping("/active")
    public ResponseEntity<Session> getActiveSession(Authentication authentication) {
        String userId = authentication.getName();

        Optional<Session> active = sessionRepository
                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, SessionStatus.ACTIVE)
                .filter(s -> s.getEndTime().isAfter(Instant.now()));

        return active
                .or(() -> sessionRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, SessionStatus.PENDING_PAYMENT))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // History: only sessions that were actually paid for
    @GetMapping
    public List<Session> getMySessions(Authentication authentication) {
        return sessionRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(
                authentication.getName(), List.of(SessionStatus.ACTIVE, SessionStatus.ENDED));
    }

    // User closes the card form without paying
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable String id, Authentication authentication) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getUserId().equals(authentication.getName())) {
            throw new UnauthorizedException("Not authorized to cancel this session");
        }

        sessionService.cancelPending(session);
        return ResponseEntity.noContent().build();
    }
}