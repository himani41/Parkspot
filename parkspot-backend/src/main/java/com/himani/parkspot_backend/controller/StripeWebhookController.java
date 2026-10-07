package com.himani.parkspot_backend.controller;

import com.himani.parkspot_backend.service.SessionService;
import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhooks")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final SessionService sessionService;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    public StripeWebhookController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/stripe")
    public ResponseEntity<String> handle(@RequestBody String payload,
                                         @RequestHeader("Stripe-Signature") String signature) {
        Event event;
        try {
            // Verifies the request really came from Stripe
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            StripeObject object = extract(event);
            if (object instanceof PaymentIntent intent) {
                sessionService.onPaymentSucceeded(intent.getId());
            } else {
                log.error("Could not read PaymentIntent from event {}", event.getId());
                return ResponseEntity.status(500).body("Unreadable event");   // 500 makes Stripe retry
            }
        }
        return ResponseEntity.ok("ok");
    }

    private StripeObject extract(Event event) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        if (deserializer.getObject().isPresent()) {
            return deserializer.getObject().get();
        }
        try {
            return deserializer.deserializeUnsafe();   // fallback for API version mismatch
        } catch (EventDataObjectDeserializationException e) {
            return null;
        }
    }
}