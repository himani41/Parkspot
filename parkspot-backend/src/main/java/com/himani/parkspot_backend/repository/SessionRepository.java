package com.himani.parkspot_backend.repository;

import com.himani.parkspot_backend.model.Session;
import com.himani.parkspot_backend.model.SessionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends MongoRepository<Session, String> {
    boolean existsByUserIdAndStatus(String userId, SessionStatus status);
    boolean existsByUserIdAndStatusAndEndTimeAfter(String userId, SessionStatus status, Instant time);

    Optional<Session> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, SessionStatus status);
    Optional<Session> findByPaymentIntentId(String paymentIntentId);

    List<Session> findByUserIdAndStatusInOrderByCreatedAtDesc(String userId, Collection<SessionStatus> statuses);
    List<Session> findByStatusAndCreatedAtBefore(SessionStatus status, Instant time);
    List<Session> findByStatusAndEndTimeBefore(SessionStatus status, Instant time);
    List<Session> findByStatusAndReminderSentFalseAndEndTimeBefore(SessionStatus status, Instant time);
    boolean existsByPlateAndPlateStateAndStatus(String plate, String plateState, SessionStatus status);
    boolean existsByPlateAndPlateStateAndStatusAndEndTimeAfter(String plate, String plateState,
                                                               SessionStatus status, Instant time);
}