package com.himani.parkspot_backend.exception;

public class ZoneFullException extends RuntimeException {
    public ZoneFullException(String message) {
        super(message);
    }
}
