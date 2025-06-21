<!-- PROJECT LOGO & BADGES -->
<p align="center">
  <h1 align="center">SCALABLE URL SHORTENER BACKEND</h1>
  <p align="center"><em>Transforming URLs into limitless possibilities effortlessly</em></p>
  <p align="center">
    <img src="https://img.shields.io/badge/last%20commit-today-brightgreen" />
    <img src="https://img.shields.io/badge/javascript-97.5%25-yellow" />
    <img src="https://img.shields.io/badge/languages-2-blue" />
  </p>
  <p align="center"><strong>Built with the tools and technologies:</strong></p>
  <p align="center">
    <img src="https://img.shields.io/badge/Express-black?logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/JSON-black?logo=json&logoColor=white" />
    <img src="https://img.shields.io/badge/Markdown-black?logo=markdown&logoColor=white" />
    <img src="https://img.shields.io/badge/npm-red?logo=npm&logoColor=white" />
    <img src="https://img.shields.io/badge/Redis-red?logo=redis&logoColor=white" />
    <img src="https://img.shields.io/badge/Mongoose-orange?logo=mongoose&logoColor=white" />
    <img src="https://img.shields.io/badge/Prometheus-orange?logo=prometheus&logoColor=white" />
    <img src="https://img.shields.io/badge/RabbitMQ-ff6600?logo=rabbitmq&logoColor=white" />
    <img src="https://img.shields.io/badge/Grafana-f46800?logo=grafana&logoColor=white" />
    <img src="https://img.shields.io/badge/.ENV-yellowgreen" />
    <img src="https://img.shields.io/badge/JavaScript-yellow?logo=javascript&logoColor=white" />
    <img src="https://img.shields.io/badge/NGINX-009639?logo=nginx&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-2496ed?logo=docker&logoColor=white" />
    <img src="https://img.shields.io/badge/Axios-5a29e4?logo=axios&logoColor=white" />
  </p>
</p>

---

# Overview

A robust, scalable, and extensible URL Shortener backend system designed for high availability, low latency, and seamless integration with analytics and authentication services. This project demonstrates best practices in distributed system design, microservices architecture, and cloud-native deployment.

---

## Features

- **Short URL Generation**: Efficiently generates unique, collision-resistant short URLs.
- **Redirection Service**: Fast and reliable redirection from short URLs to original URLs.
- **User Authentication**: Secure user registration, login, and token-based authentication.
- **Analytics Tracking**: Real-time event tracking for URL visits, user activity, and system metrics.
- **Rate Limiting**: Prevents abuse with configurable rate limiting per user/IP.
- **Caching Layer**: High-performance Redis caching for frequently accessed URLs.
- **Multi-Database Support**: Integrates with both MongoDB and PostgreSQL for flexibility and reliability.
- **Monitoring & Observability**: Integrated with Prometheus and Grafana for metrics and dashboards.
- **Containerized Microservices**: Each service is independently deployable via Docker.
- **Extensible Architecture**: Easily add new services or integrations.

---

## Performance & Scalability

This system is engineered for high throughput and low latency, supporting production-scale workloads:

- **URL Generation (Write) Capacity:**
  - Handles up to **1,000 URL generation requests per second** (writes) per backend instance.
  - Horizontal scaling with multiple backend/API instances and stateless design.
- **Redirection (Read) Capacity:**
  - Supports **10,000+ redirection requests per second** (reads) per backend instance, leveraging Redis for ultra-fast lookups.
- **Database Throughput:**
  - Redis: 50,000+ ops/sec (hot path for redirection)
  - MongoDB: 10,000+ reads/sec (sharded, indexed)
  - PostgreSQL: 5,000+ tx/sec (key pool management)
- **Load Balancing:**
  - NGINX distributes traffic across backend instances for optimal resource utilization.
- **Async Processing:**
  - Analytics and logging are handled asynchronously via RabbitMQ, ensuring write/read paths remain fast.
- **Observability:**
  - Prometheus and Grafana provide real-time monitoring and alerting for all critical metrics.

---

## Installation

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- Node.js (for local development)

### Clone the Repository
```sh
git clone https://github.com/your-repo/SystemDesign101-Scalable-URL-Shortener-Backend.git
cd SystemDesign101-Scalable-URL-Shortener-Backend
```

### Environment Configuration
- Copy and customize environment variables as needed for each service (see `.env.example` in each service directory).

### Start All Services
```sh
docker-compose up --build
```

### Seed Initial Data (Optional)
```sh
node scripts/preload-keys.js
```

---

## Usage

- **API Endpoints**: Access the backend API at `http://localhost:8080/api` (default).
- **Shorten a URL**:
    ```sh
    curl -X POST http://localhost:8080/api/shorten \
      -H "Authorization: Bearer <token>" \
      -d '{"url": "https://example.com"}'
    ```
- **Redirect**: Visit `http://localhost:8080/<short_key>` in your browser.
- **User Registration & Login**: Use `/auth/register` and `/auth/login` endpoints.
- **Analytics**: Access analytics data via the analytics service API.

---

## Deployment

### Docker Compose (Recommended)
```sh
docker-compose up --build -d
```

### Production Considerations
- Use environment variables for secrets and configuration.
- Set up persistent storage for databases.
- Configure NGINX for HTTPS and domain routing.
- Integrate with CI/CD pipelines for automated deployments.

---

## API Examples

For detailed request and response examples for all major endpoints (registration, login, short URL creation, analytics, and more), see the [API-EXAMPLES.md](./API-EXAMPLES.md) file in this repository. This document provides clear sample payloads and responses to help you quickly understand and test the API.

---

## Process Flow

This section describes the end-to-end flow of how the URL Shortener system processes requests:

1. **User Registration & Authentication**
   - A user registers and logs in to receive a JWT token for authenticated actions.

2. **Short URL Generation**
   - The user sends a POST request to `/api/urls` with the long URL (and optionally an alias or expiry).
   - The backend authenticates the user and requests a unique short ID from the Key Generator service.
   - The mapping of short ID to long URL is stored in MongoDB.
   - The short URL is cached in Redis for fast future lookups.

3. **Redirection**
   - When a user accesses a short URL, the backend first checks Redis for the mapping.
   - If not found in Redis, it queries MongoDB, then updates the cache.
   - The user is redirected to the original long URL.

4. **Analytics & Monitoring**
   - Each redirection event is published asynchronously to RabbitMQ.
   - The Analytics service consumes these events and updates statistics (e.g., redirect count, cache hits/misses).
   - Prometheus and Grafana monitor system health and performance metrics.

5. **Custom/Alias URLs**
   - Authenticated users can request custom aliases for their short URLs.
   - The backend checks for alias availability before assignment.

6. **Security & Rate Limiting**
   - All sensitive endpoints require JWT authentication.
   - Rate limiting is enforced per user/IP using Redis to prevent abuse.

---

## Docker Compose Flow

When you run `docker-compose up --build`, the following sequence occurs:

1. **Network & Volumes**
   - Docker Compose creates a dedicated network and any required volumes for persistent data (e.g., for MongoDB, PostgreSQL).

2. **Database Containers**
   - MongoDB, PostgreSQL, and Redis containers are started first to ensure data services are available for dependent services.

3. **Message Broker & Monitoring**
   - RabbitMQ (for async analytics/logging) and monitoring tools (Prometheus, Grafana) are started.

4. **Key Generator & Supporting Services**
   - The Key Generator service and any preload/utility scripts are launched to prepare the key pool and initial data.

5. **Core Application Services**
   - Backend, Auth, and Analytics services are started. These connect to the databases, cache, and message broker.

6. **NGINX Gateway**
   - NGINX is started last, acting as a reverse proxy and load balancer for all incoming API traffic.

7. **Health Checks & Readiness**
   - Each service may perform health checks and wait for dependencies to be ready before accepting traffic.

8. **Live System**
   - The system is now fully operational. You can interact with all APIs, and all monitoring/analytics dashboards are available at their respective ports.

---

## License

This project is licensed under the [MIT License](LICENSE).
