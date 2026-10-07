package com.himani.parkspot_backend.controller;

import com.himani.parkspot_backend.model.BookingPreview;
import com.himani.parkspot_backend.model.BookingRequest;
import com.himani.parkspot_backend.model.ParkResponse;
import com.himani.parkspot_backend.service.SessionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final SessionService sessionService;

    public BookingController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/preview")
    public BookingPreview preview(@RequestBody BookingRequest request, Authentication authentication) {
        return sessionService.preview(authentication.getName(), request);
    }

    @PostMapping
    public ParkResponse book(@RequestBody BookingRequest request, Authentication authentication) {
        return sessionService.book(authentication.getName(), request);
    }
}