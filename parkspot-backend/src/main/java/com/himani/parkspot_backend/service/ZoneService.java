package com.himani.parkspot_backend.service;

import com.himani.parkspot_backend.exception.BadRequestException;
import com.himani.parkspot_backend.exception.NotFoundException;
import com.himani.parkspot_backend.exception.ZoneFullException;
import com.himani.parkspot_backend.model.Zone;
import com.himani.parkspot_backend.repository.ZoneRepository;
import com.mongodb.client.result.UpdateResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ZoneService {

    private static final Logger log = LoggerFactory.getLogger(ZoneService.class);

    private final ZoneRepository zoneRepository;
    private final MongoTemplate mongoTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final CodeAttemptLimiter attemptLimiter;

    public ZoneService(ZoneRepository zoneRepository, MongoTemplate mongoTemplate,
                       SimpMessagingTemplate messagingTemplate, CodeAttemptLimiter attemptLimiter) {
        this.zoneRepository = zoneRepository;
        this.mongoTemplate = mongoTemplate;
        this.messagingTemplate = messagingTemplate;
        this.attemptLimiter = attemptLimiter;
    }

    // The number typed must belong to THIS zone. Returns the zone if it does.
    public Zone verifyCode(String userId, String zoneId, String code) {
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new NotFoundException("Zone not found"));

        String key = userId + ":" + zoneId;
        attemptLimiter.checkNotLocked(key);

        if (code == null || zone.getCode() == null || !zone.getCode().equals(code.trim())) {
            attemptLimiter.recordFailure(key);
            throw new BadRequestException("Invalid zone number");
        }
        attemptLimiter.reset(key);
        return zone;
    }

    public void holdSpot(String zoneId) {
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new NotFoundException("Zone not found"));

        Query query = new Query(Criteria.where("id").is(zoneId)
                .and("currentCount").lt(zone.getCapacity()));
        UpdateResult result = mongoTemplate.updateFirst(query, new Update().inc("currentCount", 1), Zone.class);

        if (result.getModifiedCount() == 0) {
            throw new ZoneFullException("Zone is full");
        }
        broadcast(zoneId);
    }

    public void releaseSpot(String zoneId) {
        Query query = new Query(Criteria.where("id").is(zoneId).and("currentCount").gt(0));
        UpdateResult result = mongoTemplate.updateFirst(query, new Update().inc("currentCount", -1), Zone.class);

        if (result.getModifiedCount() > 0) {
            broadcast(zoneId);
        }
    }

    private void broadcast(String zoneId) {
        try {
            zoneRepository.findById(zoneId)
                    .ifPresent(zone -> messagingTemplate.convertAndSend("/topic/zones", zone));
        } catch (Exception e) {
            log.warn("Could not broadcast zone {}: {}", zoneId, e.getMessage());
        }
    }
}