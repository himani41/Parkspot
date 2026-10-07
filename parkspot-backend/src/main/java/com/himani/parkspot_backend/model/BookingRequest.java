package com.himani.parkspot_backend.model;

public record BookingRequest(String zoneId, String zoneCode, String plate,
                             String plateState, int durationMinutes) {}