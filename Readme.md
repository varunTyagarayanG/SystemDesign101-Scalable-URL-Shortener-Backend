# Scalable URL Shortener Backend

## Goal

To build a high-performance, horizontally scalable, production-simulated URL shortener backend system that can handle:

- 1,000 URL generation requests per second (writes)
- 10,000+ redirection requests per second (reads)
- Feature enhancements such as custom URLs, authentication, analytics, and monitoring

---

## Functional Requirements

1. POST /api/urls
   - Accepts long URLs and returns a short URL
   - Supports optional custom short URLs (if available)

2. GET /:shortId
   - Redirects user to original long URL
   - Caches popular URLs using Redis

3. Authentication APIs
   - Sign-up, login, JWT-based auth
   - Auth required for custom URLs and analytics

4. Custom Short URL Feature
   - Users can define a preferred shortId (e.g., "/api/urls/mybrand")

5. Analytics (Async)
   - Track redirection events: timestamp, IP, user-agent, etc.
   - Processed through message queues

6. Preview API (Optional)
   - Fetch long URL and metadata without redirection

---

## Non-Functional Requirements

- High Throughput: 1,000 writes/sec, 10,000 reads/sec
- High Availability: Fault-tolerant databases and services
- Low Latency: Under 100ms for redirection
- Observability: Metrics and logs
- Security: Input validation, HTTPS, rate limiting

---

## Architecture Overview

### Core Components (Dockerized)

| Service               | Description                                           |
|-----------------------|-------------------------------------------------------|
| nginx                 | Load balances requests across backend instances       |
| backend-1, backend-2  | Node.js Express apps                                  |
| mongodb               | Stores shortId to longUrl mappings                    |
| postgresql            | Stores pool of preloaded unique shortIds             |
| redis                 | In-memory cache for hot URLs                          |
| key-preloader         | Fills PostgreSQL with base62 keys                     |
| key-generator-service | Handles shortId generation and reservation            |
| auth-service          | JWT-based user login/signup                           |
| rabbitmq              | Async message queue for logging, analytics            |
| prometheus            | Metrics collection                                    |
| grafana               | Metrics visualization                                 |
| logger-service        | Centralized log collector (stdout or file)            |

---

## Data Flow

1. User sends long URL to POST /api/urls
2. Backend asks key-generator-service for a shortId
3. ShortId is marked as used in PostgreSQL
4. Mapping saved in MongoDB
5. Redis preloaded with shortId to longUrl
6. Event sent to RabbitMQ for logging/analytics
7. On redirection (GET /:shortId):
   - Redis hit leads to redirect
   - Redis miss falls back to Mongo, then cache and redirect

---

## Feature Modules

### Authentication

- Login/Signup endpoints
- JWT verification middleware
- Auth required for custom URL and analytics access

### Key Generator Microservice

- Ensures collision-free shortId assignment
- Uses preloaded keys in PostgreSQL

### Custom Short URL

- Check if custom shortId is taken
- Authenticated users can reserve branded short URLs

### Analytics

- Publish click events to RabbitMQ
- Consumer service stores analytics in MongoDB or time-series DB

### Logging

- All requests and errors are logged
- Log format: [timestamp] [service] [event]

### Rate Limiting

- Token bucket (per IP or user)
- Implemented via Redis

---

## Performance Plan

| Component          | Throughput Capacity        | Bottleneck Risk              |
|--------------------|-----------------------------|-------------------------------|
| Node.js Backend    | 2,000 req/sec per instance | Medium if synchronous I/O     |
| PostgreSQL         | 5,000 tx/sec (preloaded)   | Key assignment locks          |
| Redis              | 50,000+ ops/sec            | Low                           |
| MongoDB            | 10,000+ reads/sec          | Requires sharding and indexes |
| NGINX              | 10,000+ req/sec            | None                          |

---

## Known Bottlenecks and Mitigations

- Key Assignment Race: Use transactions or distributed locks in Postgres
- Logging Lag: Buffer logs or send to message queue
- Redis Cache Misses: Optimize TTL and LRU policy
- Node.js Blocking: Avoid synchronous operations; use async I/O
- Sharding Overhead: Pre-hash shortId for sharded MongoDB writes

---

## Boot Sequence

1. Redis, Postgres, MongoDB
2. Key-generator and preload service
3. Auth-service
4. Backend instances
5. Logger and consumers
6. NGINX
7. Prometheus and Grafana

---

## Local Development and Testing

- Use Docker Compose
- Tools:
  - wrk, k6 for load testing
  - Postman for API validation
  - Prometheus and Grafana for dashboards
- Log files per container (/logs/*.log)
- RabbitMQ dashboard for queue inspection

---

## Future Enhancements

- User dashboards and link management
- Editable and expiring URLs
- QR code generation
- Admin panel for system metrics
- Geo-based analytics

---

Project Owner: Gadigala Varun Tyagarayan  
Status: In active development
