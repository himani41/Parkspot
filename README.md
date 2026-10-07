# ParkSpot NYC

Real-time street-parking availability and prepaid booking for New York City, built with React, Spring Boot and MongoDB.

**Live demo:** https://parkspot-phi.vercel.app

> The backend runs on a free tier and sleeps after ~15 minutes idle, so the first request can take up to a minute. Payments use **Stripe test mode**. No real money is ever charged.

---

## What it does

-   Shows real NYC parking meters on a map. **Green** means spots are available, **red** means the zone is full.
-   Updates live over WebSockets, so a spot taken by another driver turns the zone red without a refresh.
-   Lets a driver book timed, prepaid parking: choose a duration (10 minutes to 4 hours) with a stepper and quick-add chips.
-   Proves you are physically there: you must enter the **number printed on the meter pole**, plus your license plate. A wrong number shows "Invalid".
-   Shows a live countdown with a warning 5 minutes before the session ends, and keeps a history of past sessions.

## Tech stack

| Layer      | Technology                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Frontend   | React (Vite), Redux Toolkit, React Router, React-Leaflet, Tailwind CSS, `@stomp/stompjs`, Stripe Elements            |
| Backend    | Java 21, Spring Boot 4, Spring Security (stateless JWT), Spring Data MongoDB, Spring WebSocket (STOMP), `@Scheduled` |
| Database   | MongoDB Atlas                                                                                                        |
| Payments   | Stripe PaymentIntents + signature-verified webhook                                                                   |
| Data       | NYC Open Data, "Parking Meters Locations and Status"                                                                 |
| Deployment | Docker, Render (backend), Vercel (frontend)                                                                          |

## How it works

```
 React (Vercel)  ──REST──▶  Spring Boot (Render)  ──▶  MongoDB Atlas
       ▲   │                      │    ▲
       │   └──── Stripe.js ─────▶ │    │
       │                          ▼    │
       └──── WebSocket (STOMP) ◀──┘  Stripe webhook
```

### Booking flow (prepaid)

1. Click a zone and press **Book here**.
2. Enter the pole number, license plate and duration. The server validates everything and returns a price preview.
3. Confirm. The server holds a spot and creates a Stripe PaymentIntent. The session is `PENDING_PAYMENT`.
4. Pay with the card form.
5. Stripe calls the webhook. Only then does the session become `ACTIVE` and the countdown starts.

Session lifecycle: `PENDING_PAYMENT → ACTIVE → ENDED`, or `PENDING_PAYMENT → CANCELLED`.

### Design decisions

-   **Atomic spot hold.** A single conditional MongoDB update (`currentCount < capacity` then `$inc`) means two people racing for the last spot cannot both win. Tested with concurrent requests: one gets 200, the other 409.
-   **Pole number stays secret.** The zone code is never serialized (`@JsonIgnore`), so it is not in `GET /zones` or in WebSocket broadcasts. 5 wrong tries lock a user out of that zone for 15 minutes.
-   **Server-side pricing.** Money is stored as integer cents at $0.10/minute, 10 minute minimum, 4 hour maximum. The client never decides the price.
-   **License plates are normalized.** Uppercased, spaces and dashes stripped, 2-8 characters, stored with a 2-letter state. One active booking per plate and per user.
-   **Webhook-only activation.** Payment success is confirmed server-to-server, never trusted from the browser. Every state transition checks the current status first, so repeated webhooks are harmless. A payment that arrives after a session was cancelled is refunded automatically.
-   **Viewport loading.** The map only fetches zones inside the visible area, at zoom 15 and above, and draws them on a canvas, so 11,000+ zones stay fast.
-   **Consistent errors.** One `{"error": "..."}` shape with proper 400/401/403/404/409/429/502 codes via a global `@RestControllerAdvice`.
-   **Security basics.** Stateless JWT, BCrypt passwords, CORS locked to the frontend origin, all secrets in environment variables.
-   **Cleanup job.** A scheduler runs every minute: expires unpaid sessions after 5 minutes, logs the 5-minute reminder, and ends finished sessions.

## Data

Meter locations come from the NYC Open Data "Parking Meters Locations and Status" dataset. On first startup the backend seeds about **11,159 zones** from ~15,600 rows, skipping inactive meters, rows without coordinates and duplicates.

Real-time availability is **simulated**: each zone gets a capacity of 4, 5, 7 or 10 spots, picked deterministically from its meter code.

## API overview

| Method | Path                           | Purpose                             |
| ------ | ------------------------------ | ----------------------------------- |
| POST   | `/auth/signup`, `/auth/login`  | Create account / get JWT            |
| GET    | `/users/me`                    | Current user                        |
| GET    | `/zones?south&north&west&east` | Zones in the map viewport           |
| POST   | `/bookings/preview`            | Validate and price a booking        |
| POST   | `/bookings`                    | Hold a spot, create PaymentIntent   |
| GET    | `/sessions/active`             | Current active session              |
| GET    | `/sessions`                    | History                             |
| POST   | `/sessions/{id}/cancel`        | Cancel an unpaid booking            |
| POST   | `/zones/sessions/{id}/leave`   | End a session early                 |
| POST   | `/webhooks/stripe`             | Stripe webhook (signature verified) |
| WS     | `/ws`                          | Live zone updates on `/topic`       |

## Run locally

Requirements: Java 21, Node 18+, a MongoDB Atlas (or local) database, a Stripe account in test mode, the Stripe CLI.

**Backend** (`parkspot-backend/`)

| Variable                  | Meaning                                           |
| ------------------------- | ------------------------------------------------- |
| `MONGODB_URI`             | MongoDB connection string                         |
| `JWT_SECRET`              | At least 32 bytes, e.g. `openssl rand -base64 48` |
| `STRIPE_SECRET_KEY`       | `sk_test_...`                                     |
| `STRIPE_WEBHOOK_SECRET`   | `whsec_...` from `stripe listen`                  |
| `APP_CORS_ALLOWED_ORIGIN` | Defaults to `http://localhost:5173`               |

```bash
cd parkspot-backend
./mvnw spring-boot:run

# in a second terminal
stripe listen --events payment_intent.succeeded --forward-to localhost:8080/webhooks/stripe
```

**Frontend** (`parkspot-frontend/`), create a `.env`:

```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

```bash
cd parkspot-frontend
npm install
npm run dev
```

Test cards: `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined. Use any future expiry and any CVC.

## Deployment

-   **Frontend:** Vercel, root directory `parkspot-frontend`, with `vercel.json` rewriting all routes to the SPA.
-   **Backend:** Render (Docker), root directory `parkspot-backend`, using the included two-stage Dockerfile. Uses a separate `parkspot_prod` database and its own database user.
-   **Stripe:** a webhook endpoint pointing at `https://<backend>/webhooks/stripe` for `payment_intent.succeeded`, with its signing secret set as `STRIPE_WEBHOOK_SECRET`.

## Try it

Sign up, zoom into the map until the markers appear, click the zone below and use its pole number:

| Street                                                                              | Pole number |
| ----------------------------------------------------------------------------------- | ----------- |
| Mac Dougal Street (Mac Dougal Alley to West 8 Street), E side                       | 116348      |
| West 42 Street (5 Avenue to Avenue Of The Americas), N side (spot near Bryant park) | 107052      |

## Known limitations

-   Meter pole numbers are public in the NYC dataset, so the check proves familiarity with the data rather than true physical presence.
-   Availability is simulated, not read from real sensors.
-   Wrong-number lockout is in memory, so it resets on restart and does not span multiple instances.
-   Ending a session early does not refund unused time.
-   Refreshing during card entry does not resume the payment form.
-   Free-tier hosting means cold starts and delayed scheduled cleanup.

## Roadmap

-   Officer lookup endpoint to verify a plate has a paid session
-   Automated test suite (unit and integration)
-   Early-leave partial refunds
-   Real push or SMS reminders
-   Redis-backed rate limiting

## Credits

Meter data: [NYC Open Data](https://opendata.cityofnewyork.us/). This is an independent portfolio project, not affiliated with or endorsed by NYC DOT or ParkNYC.
