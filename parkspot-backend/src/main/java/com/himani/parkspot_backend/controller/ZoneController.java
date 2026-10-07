package com.himani.parkspot_backend.controller;

import com.himani.parkspot_backend.exception.NotFoundException;
import com.himani.parkspot_backend.exception.UnauthorizedException;
import com.himani.parkspot_backend.model.Session;
import com.himani.parkspot_backend.model.Zone;
import com.himani.parkspot_backend.repository.SessionRepository;
import com.himani.parkspot_backend.repository.ZoneRepository;
import com.himani.parkspot_backend.service.SessionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@RestController
@RequestMapping("/zones")
public class ZoneController {

    private final ZoneRepository zoneRepository;
    private final SessionRepository sessionRepository;
    private final SessionService sessionService;

    public ZoneController(ZoneRepository zoneRepository, SessionRepository sessionRepository, SessionService sessionService) {
        this.zoneRepository = zoneRepository;
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
    }

    private static final int MAX_ZONES_PER_REQUEST = 1000;

    @GetMapping
    public List<Zone> getZones(@RequestParam double south, @RequestParam double north,
                               @RequestParam double west, @RequestParam double east) {
        return zoneRepository.findByLatBetweenAndLonBetween(
                south, north, west, east, PageRequest.of(0, MAX_ZONES_PER_REQUEST));
    }

    @PostMapping("/sessions/{sessionId}/leave")
    public Zone leaveSession(@PathVariable String sessionId, Authentication authentication) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getUserId().equals(authentication.getName())) {
            throw new UnauthorizedException("Not authorized to leave session");
        }

        sessionService.endSession(session);

        return zoneRepository.findById(session.getZoneId())
                .orElseThrow(() -> new NotFoundException("Zone not found"));
    }
}