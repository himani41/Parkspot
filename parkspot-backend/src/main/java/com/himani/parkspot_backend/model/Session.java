package com.himani.parkspot_backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.aggregation.ArrayOperators;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;

@Document(collection = "sessions")
@Data
@NoArgsConstructor
public class Session {
    @Id
    private String id;
    private String userId;
    private String zoneId;
    private SessionStatus status;
    private int durationMinutes;
    private long costCents;
    private String paymentIntentId;
    private Instant createdAt;   // when the booking was made
    private Instant startTime;   // set when payment succeeds
    private Instant endTime;     // startTime + duration
    private Instant endedAt;     // when it actually ended
    private boolean reminderSent;
    private String zoneName;     // shown on My sessions
    private String plate;        // normalized, e.g. "ABC1234"
    private String plateState;   // e.g. "NY"
}
