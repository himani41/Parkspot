package com.himani.parkspot_backend.exception;

public class AlreadyParkedException extends RuntimeException {
    public AlreadyParkedException(String message) {
        super(message);
    }
}
