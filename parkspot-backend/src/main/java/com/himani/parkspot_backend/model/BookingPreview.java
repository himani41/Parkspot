package com.himani.parkspot_backend.model;

public record BookingPreview(String zoneId, String zoneName, int spotsLeft, int capacity,
                             String plate, String plateState, int durationMinutes, long costCents) {}