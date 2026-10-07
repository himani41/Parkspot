package com.himani.parkspot_backend.service;

import com.himani.parkspot_backend.exception.TooManyAttemptsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CodeAttemptLimiter {

    private static final int MAX_FAILURES = 5;
    private static final Duration LOCK = Duration.ofMinutes(15);

    private record Entry(int failures, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();

    public void checkNotLocked(String key) {
        Entry e = entries.get(key);
        if (e != null && e.lockedUntil() != null && Instant.now().isBefore(e.lockedUntil())) {
            throw new TooManyAttemptsException("Too many wrong numbers. Try again in a few minutes.");
        }
    }

    public void recordFailure(String key) {
        Instant now = Instant.now();
        entries.compute(key, (k, old) -> {
            boolean fresh = old == null || (old.lockedUntil() != null && now.isAfter(old.lockedUntil()));
            int failures = fresh ? 1 : old.failures() + 1;
            return new Entry(failures, failures >= MAX_FAILURES ? now.plus(LOCK) : null);
        });
    }

    public void reset(String key) {
        entries.remove(key);
    }
}