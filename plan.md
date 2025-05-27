## Week 1: Foundations & Core Services

### Day 1 – Project Kickoff & Environment Setup
- Define repository structure and initialize Git  
- Install Node.js, Docker, Docker-Compose locally  
- Draft initial `docker-compose.yml` with placeholders for each service  

### Day 2 – Basic Backend Scaffold
- Spin up a minimal Express app  
- Wire in environment variable management (`dotenv`)  
- Create `routes/` folder and stub `POST /api/urls` & `GET /:shortId` endpoints  

### Day 3 – Database Integration
- Stand up MongoDB & PostgreSQL containers  
- Define Postgres table for preloaded keys and MongoDB collection for URL mappings  
- Implement connection logic in your app (no business logic yet)  

### Day 4 – Redis Caching Layer
- Add Redis container and connection module  
- Integrate cache in the redirect endpoint: check Redis first, then Mongo fallback  
- Validate TTL and LRU eviction settings in `redis.conf`  

### Day 5 – Key-Generator Microservice & Preloader Script
- Build a standalone service to generate (or fetch) an unused `shortId` from Postgres  
- Write and run a script (containerized) to preload ~10 million Base62 keys into Postgres in batches  

### Day 6 – Wire Up URL Shortening Logic
- In your main backend, call the key-generator service from `POST /api/urls`  
- Save the mapping in MongoDB and prime Redis cache  
- Return full `http://<host>/:shortId` to the client  

### Day 7 – Basic Load Balancer & Multi-Instance Testing
- Add two backend replicas in Docker-Compose and configure NGINX for round-robin  
- Smoke-test: fire requests against NGINX and confirm even distribution and correct routing  

---

## Week 2: Advanced Features & Observability

### Day 8 – Authentication Service
- Stand up an `auth-service` container with signup/login and JWT issuance  
- Protect custom-URL and analytics endpoints with JWT middleware  

### Day 9 – Custom Short URLs
- Extend `POST /api/urls` to accept an optional `customId`  
- Validate uniqueness (via key-generator or direct DB check)  
- Enforce auth for branded links  

### Day 10 – Messaging Queue & Analytics Pipeline
- Add RabbitMQ (or NATS) container  
- Publish redirect events (timestamp, `shortId`, IP, UA) to the queue  
- Create a simple consumer that logs or persists analytics in MongoDB or a TSDB  

### Day 11 – Structured Logging & Rate Limiting
- Integrate a fast JSON logger (e.g. pino or winston) in all services  
- Mount log volume and verify per-container log files  
- Implement Redis-backed token-bucket rate limiting on API endpoints  

### Day 12 – Database Sharding & Replication
- Simulate two Postgres shards (or at least master + read-replica) in Compose  
- Configure MongoDB sharding on `shortId` prefix (even if single replica for local)  

### Day 13 – Metrics Collection with Prometheus & Grafana
- Stand up Prometheus & Grafana containers  
- Instrument Node.js backends with a Prometheus client (expose `/metrics`)  
- Build a Grafana dashboard: throughput, latency, cache-hit ratio  

### Day 14 – End-to-End Testing & Optimization
- Run load tests (`wrk`, `k6`) at 1,000 POSTs/sec and 10,000 GETs/sec through NGINX  
- Monitor logs, metrics, queue backlog  
- Tweak connection-pool sizes, cache TTL, and key-generator batching  
- Prepare a brief write-up or demo script showcasing each feature  
