package com.himani.parkspot_backend.service;

import com.himani.parkspot_backend.model.Session;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${stripe.secret-key}")
    private String secretKey;

    @PostConstruct
    void init() {
        Stripe.apiKey = secretKey;
    }

    // The amount comes from OUR database, never from the client
    public PaymentIntent createIntent(Session session) throws StripeException {
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(session.getCostCents())
                .setCurrency("usd")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .setAllowRedirects(PaymentIntentCreateParams.AutomaticPaymentMethods.AllowRedirects.NEVER)
                                .build())
                .putMetadata("sessionId", session.getId())
                .build();
        return PaymentIntent.create(params);
    }

    public void cancelIntent(String paymentIntentId) {
        try {
            PaymentIntent.retrieve(paymentIntentId).cancel();
        } catch (Exception e) {
            log.warn("Could not cancel PaymentIntent {}: {}", paymentIntentId, e.getMessage());
        }
    }

    public void refund(String paymentIntentId) {
        try {
            com.stripe.model.Refund.create(
                    RefundCreateParams.builder().setPaymentIntent(paymentIntentId).build());
            log.info("Refunded PaymentIntent {}", paymentIntentId);
        } catch (Exception e) {
            log.error("REFUND FAILED for PaymentIntent {}: {}", paymentIntentId, e.getMessage());
        }
    }
}