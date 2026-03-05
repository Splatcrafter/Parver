<p align="center">
  <h1 align="center">ParVer</h1>
  <p align="center">
    <strong>Smart Parking Space Management for Organizations</strong>
  </p>
  <p align="center">
    Maximize parking lot utilization through dynamic spot sharing, real-time availability tracking, and instant push notifications.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version">
    <img src="https://img.shields.io/badge/java-21-orange" alt="Java 21">
    <img src="https://img.shields.io/badge/spring%20boot-3.5.9-brightgreen" alt="Spring Boot">
    <img src="https://img.shields.io/badge/react-19-61DAFB" alt="React 19">
    <img src="https://img.shields.io/badge/typescript-5.7-3178C6" alt="TypeScript">
    <img src="https://img.shields.io/badge/docker-ready-2496ED" alt="Docker">
    <img src="https://img.shields.io/badge/PWA-enabled-5A0FC8" alt="PWA">
  </p>
</p>

---

## Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Development](#development)
- [Deployment](#deployment)
- [License & Acknowledgments](#license--acknowledgments)

---

## About

Many organizations assign fixed parking spots to employees, but a significant number of those spots sit empty on any given day due to vacations, remote work, sick leave, or off-site meetings. **ParVer** (short for **Par**kplatz-**Ver**waltung, German for "Parking Management") solves this by enabling spot owners to dynamically release their spots for specific time windows, while colleagues without assigned spots can browse, book, and receive real-time notifications when spaces become available.

**The core idea is simple:** Turn unused parking capacity into shared, bookable resources &mdash; without changing the underlying ownership model.

### How It Works

1. **Spot owners** release their assigned spot for a specific date range when they won't need it.
2. **Spot seekers** browse a visual grid of the parking lots and book available spots within the released time windows.
3. **Real-time updates** via Server-Sent Events (SSE) keep every user's view in sync &mdash; no manual refresh required.
4. **Push notifications** alert opt-in seekers the moment a spot becomes available.

---

## Key Features

| Feature                          | Description                                                                                                                                                  |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Time-Based Release & Booking** | Spot owners release their space for configurable date/time ranges. Seekers book within those windows. Overlap protection is enforced server-side.            |
| **Real-Time Status Updates**     | Server-Sent Events broadcast every status change instantly to all connected clients.                                                                         |
| **Web Push Notifications**       | Users can opt in as "seeking" and receive push notifications when any spot becomes available. Powered by the VAPID/Web Push protocol.                        |
| **Visual Parking Grid**          | Two distinct parking zones ("small" and "large") are rendered as interactive grids with color-coded status indicators (red/green/gray).                      |
| **Role-Based Access Control**    | Admins manage users and parking assignments. Regular users manage their own spots or book available ones.                                                    |
| **Misuse Reporting**             | On-site discrepancies (e.g., a "free" spot is physically blocked) can be reported through a dedicated dialog, with admin review/resolution workflow.         |
| **Progressive Web App**          | Installable on iOS and Android via "Add to Home Screen". Full-screen mode, service worker caching, and native-like experience &mdash; no app store required. |
| **OTP-Secured Initial Setup**    | First-run setup flow with one-time password verification to create the initial admin account.                                                                |
| **OpenAPI-First Design**         | API contract defined in OpenAPI 3.0 YAML. Backend Spring delegates and frontend TypeScript types are auto-generated from a single source of truth.           |

---

## Tech Stack

### Backend

| Technology                 | Version | Purpose                            |
|----------------------------|---------|------------------------------------|
| Java                       | 21      | Runtime                            |
| Spring Boot                | 3.5.9   | Application framework              |
| Spring Security            | 6.x     | Authentication & authorization     |
| Spring Data JPA            | 3.x     | Database access (Hibernate ORM)    |
| JJWT                       | 0.12.6  | JWT token creation & validation    |
| web-push (nl.martijndwars) | 5.1.1   | Web Push notification delivery     |
| BouncyCastle               | 1.80    | Cryptographic operations for VAPID |
| SpringDoc OpenAPI          | 2.8.16  | Swagger UI & API documentation     |
| H2 Database                | -       | In-memory DB for development       |
| MariaDB                    | 11      | Production database                |

### Frontend

| Technology      | Version | Purpose                        |
|-----------------|---------|--------------------------------|
| React           | 19.0.0  | UI library                     |
| TypeScript      | 5.7     | Type-safe JavaScript           |
| Vite            | 6.0.0   | Build tool & dev server        |
| Tailwind CSS    | 4.0.0   | Utility-first styling          |
| Radix UI        | -       | Accessible headless components |
| Framer Motion   | -       | Animations & transitions       |
| Lucide React    | -       | Icon library                   |
| React Router    | 7.1.0   | Client-side routing            |
| vite-plugin-pwa | -       | Service worker & PWA manifest  |

### Infrastructure

| Technology                | Purpose                                         |
|---------------------------|-------------------------------------------------|
| Docker                    | Multi-stage containerized builds                |
| Docker Compose            | Local & production orchestration                |
| GitHub Actions            | CI/CD pipeline (build & push to GHCR)           |
| GitHub Container Registry | Docker image hosting                            |
| Maven Wrapper             | Reproducible builds without pre-installed Maven |
| OpenAPI Generator         | 7.20.0                                          | API code generation (Spring + TypeScript) |

---

## Architecture

### High-Level Overview

ParVer follows a **monolithic deployment** pattern: the React frontend is compiled at build time and embedded as static resources inside the Spring Boot JAR. The entire application runs as a single process serving both the API and the SPA.

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│   React 19 PWA + Service Worker + Push Subscription  │
└──────────┬──────────────────┬───────────────────────┘
           │ REST/JSON        │ SSE (EventSource)
           ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                Spring Boot Application              │
│                                                     │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Security │  │Controllers│  │  SSE Controller  │  │
│  │  (JWT)   │  │(Delegates)│  │ (Event Streams)  │  │
│  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
│       │              │                 │            │
│  ┌────▼──────────────▼─────────────────▼──────────┐ │
│  │              Service Layer                     │ │
│  │ ParkingSpotService · UserService · PushService │ │
│  └────────────────────┬───────────────────────────┘ │
│                       │                             │
│  ┌────────────────────▼───────────────────────────┐ │
│  │          Spring Data JPA Repositories          │ │
│  └────────────────────┬───────────────────────────┘ │
└───────────────────────┼─────────────────────────────┘
                        │
               ┌────────▼────────┐
               │    MariaDB 11   │
               │   (or H2 dev)   │
               └─────────────────┘
```

### Data Model

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────────────┐
│    Users     │       │  Parking Spots  │       │  Push Subscriptions  │
├──────────────┤       ├─────────────────┤       ├──────────────────────┤
│ id           │──1:1──│ spot_number (PK)│       │ id                   │
│ username     │       │ area            │       │ user_id (FK)         │
│ display_name │       │ owner_id (FK)   │       │ endpoint             │
│ password_hash│       │ created_at      │       │ p256dh               │
│ role         │       │ updated_at      │       │ auth                 │
│ created_at   │       └────────┬────────┘       │ seeking_parking      │
│ updated_at   │                │                └──────────────────────┘
└──────────────┘                │ 1:N
                       ┌────────▼────────┐
                       │    Releases     │
                       ├─────────────────┤
                       │ id              │
                       │ spot_number(FK) │
                       │ available_from  │
                       │ available_to    │
                       └────────┬────────┘
                                │ 1:N
                       ┌────────▼────────┐       ┌──────────────────────┐
                       │    Bookings     │       │      Reports         │
                       ├─────────────────┤       ├──────────────────────┤
                       │ id              │       │ id                   │
                       │ release_id (FK) │       │ spot_number (FK)     │
                       │ booked_by (FK)  │       │ reporter_id (FK)     │
                       │ booked_from     │       │ comment              │
                       │ booked_to       │       │ status               │
                       └─────────────────┘       │ created_at           │
                                                 └──────────────────────┘
```

### Parking Spot Status Lifecycle

A parking spot's status is computed dynamically based on its current ownership and active releases/bookings:

```
                  ┌──────────┐
       No owner   │ INACTIVE │  Gray - not participating
       assigned   │  (Gray)  │  in the system
                  └──────────┘
                       │
                  Owner assigned
                       ▼
                  ┌──────────┐
       Default    │ OCCUPIED │  Red - owner holds the
       state      │  (Red)   │  spot, not released
                  └──────────┘
                       │
                  Owner creates release
                       ▼
                  ┌───────────┐
       Released   │ AVAILABLE │  Green - open for
       to others  │  (Green)  │  booking by seekers
                  └───────────┘
                       │
                  Seeker books the spot
                       ▼
                  ┌──────────┐
       Booked     │  BOOKED  │  Red - reserved by
       by seeker  │  (Red)   │  another user
                  └──────────┘
```

---

## Getting Started

### Prerequisites

| Requirement                 | Notes                                                                |
|-----------------------------|----------------------------------------------------------------------|
| **Java 21 JDK**             | Required for building and running the backend                        |
| **Maven 3.9+**              | Included via Maven Wrapper (`mvnw`) &mdash; no manual install needed |
| **Node.js v24+**            | Auto-installed by the frontend-maven-plugin during build             |
| **Docker & Docker Compose** | Optional, for containerized deployment                               |

### Quick Start &mdash; Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Splatcrafter/ParVer.git
cd ParVer

# 2. Build the entire project (backend + frontend)
./mvnw clean package -DskipTests

# 3. Start the application with the dev profile (H2 in-memory database)
java -Dspring.profiles.active=dev -jar parver-backend/target/parver-backend-0.1.0.jar
```

The application is now running at **http://localhost:8080**.

> **Tip:** For frontend hot-reload during development, run the Vite dev server in a separate terminal:
> ```bash
> cd parver-frontend/src/main/resources/parver-frontend
> npm install
> npm run dev
> ```
> The Vite dev server proxies API requests to `http://localhost:8080` automatically.

### Quick Start &mdash; Docker

```bash
# Development build (builds from source)
docker compose up --build

# Production (pulls pre-built image from GHCR)
docker compose -f docker-compose.prod.yml up -d
```

> **Note:** Create a `.env` file in the project root with the required environment variables before running Docker Compose. See [Configuration](#configuration) for details.

### Default Development Credentials

When running with the `dev` profile, the following test accounts are seeded automatically:

| Username  | Password     | Role  | Parking Spot          |
|-----------|--------------|-------|-----------------------|
| `admin`   | `admin123!`  | ADMIN | None                  |
| `lehrer1` | `password1!` | USER  | Spot #53 (small area) |
| `lehrer2` | `password2!` | USER  | None                  |

---

## Configuration

### Spring Profiles

| Profile | Database       | Schema Strategy | Use Case                                |
|---------|----------------|-----------------|-----------------------------------------|
| `dev`   | H2 (in-memory) | `create-drop`   | Local development, auto-seeds test data |
| `prod`  | MariaDB        | `update`        | Production deployment                   |

### Environment Variables (Production)

| Variable            | Required | Description                                            |
|---------------------|----------|--------------------------------------------------------|
| `DB_HOST`           | Yes      | MariaDB hostname (e.g., `mariadb`)                     |
| `DB_PORT`           | Yes      | MariaDB port (default: `3306`)                         |
| `DB_NAME`           | Yes      | Database name (default: `parver`)                      |
| `DB_USERNAME`       | Yes      | Database user                                          |
| `DB_PASSWORD`       | Yes      | Database password                                      |
| `JWT_SECRET`        | Yes      | Secret key for HMAC-SHA256 JWT signing (min. 32 bytes) |
| `VAPID_PUBLIC_KEY`  | Yes      | VAPID public key for Web Push                          |
| `VAPID_PRIVATE_KEY` | Yes      | VAPID private key for Web Push                         |
| `VAPID_SUBJECT`     | Yes      | VAPID subject (e.g., `mailto:admin@example.com`)       |

### JWT Token Configuration

| Token         | Default Lifetime         | Config Key                            |
|---------------|--------------------------|---------------------------------------|
| Access Token  | 900 seconds (15 min)     | `parver.jwt.access-token-expiration`  |
| Refresh Token | 604,800 seconds (7 days) | `parver.jwt.refresh-token-expiration` |

### Example `.env` File

```env
DB_ROOT_PASSWORD=your-root-password
DB_PASSWORD=your-db-password
JWT_SECRET=your-secret-key-at-least-32-bytes-long-here
VAPID_PUBLIC_KEY=BExamplePublicKeyBase64...
VAPID_PRIVATE_KEY=ExamplePrivateKeyBase64...
VAPID_SUBJECT=mailto:admin@yourorg.com
```

---

## API Reference

All API endpoints are prefixed with `/api`. Interactive documentation is available via **Swagger UI** at:

```
http://localhost:8080/swagger-ui/index.html
```

The OpenAPI 3.0 specification is located at:
```
parver-frontend/src/main/resources/openapi-specification/parver-api.yaml
```

## Development

### Helper Scripts

Convenience scripts are provided for both Unix and Windows:

| Script                    | Description                                              |
|---------------------------|----------------------------------------------------------|
| `./local-compile.sh`      | Build the full project: `mvnw clean package -DskipTests` |
| `./local-start.sh`        | Start the backend with the `dev` profile                 |
| `./local-frontend-dev.sh` | Start the Vite dev server with hot reload                |

### H2 Database Console

When running with the `dev` profile, the H2 in-memory database console is available at:

```
http://localhost:8080/h2-console
```

### Frontend API Type Generation

The frontend TypeScript types are generated from the OpenAPI specification:

```bash
cd parver-frontend/src/main/resources/parver-frontend
npm run generate-api
```

This reads `parver-api.yaml` and produces type-safe API definitions used by the frontend HTTP client.

### OpenAPI Code Generation

The backend API delegates (controller interfaces) are auto-generated during the Maven build via the `openapi-generator-maven-plugin`. The generated code lives under the `de.splatgames.software.external.afbb.parver.api` package. To implement a new endpoint:

1. Define it in `parver-api.yaml`
2. Run `./mvnw compile` to regenerate delegates
3. Implement the `*ApiDelegate` interface in a `@Service` class

---

## Deployment

### Docker Build

The project uses a **multi-stage Docker build** for minimal image size:

| Stage       | Base Image               | Purpose                                     |
|-------------|--------------------------|---------------------------------------------|
| **Builder** | `eclipse-temurin:21-jdk` | Compiles Maven project (backend + frontend) |
| **Runtime** | `eclipse-temurin:21-jre` | Minimal JRE with the built JAR              |

```bash
# Build locally
docker build -t parver:latest .

# Run
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=your-db-host \
  -e DB_PORT=3306 \
  -e DB_NAME=parver \
  -e DB_USERNAME=parver \
  -e DB_PASSWORD=secret \
  -e JWT_SECRET=your-32-byte-secret \
  -e VAPID_PUBLIC_KEY=... \
  -e VAPID_PRIVATE_KEY=... \
  -e VAPID_SUBJECT=mailto:admin@example.com \
  parver:latest
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the Docker image and pushes it to **GitHub Container Registry**:

```
ghcr.io/splatcrafter/parver:latest
ghcr.io/splatcrafter/parver:<commit-sha>
```

The pipeline is triggered manually via `workflow_dispatch`.

### Initial Setup

On first launch against an empty database, ParVer enters **setup mode**:

1. The application generates a **one-time password (OTP)** and logs it to the console.
2. Navigate to the application in your browser &mdash; you'll be redirected to the setup page.
3. Enter the OTP to verify your identity.
4. Create the initial **admin account** with username and password.
5. Setup is complete. Log in with your new admin credentials and start managing users and parking spots.

### Production with Docker Compose

```bash
# 1. Create your .env file (see Configuration section)
cp .env.example .env
nano .env

# 2. Start the stack
docker compose -f docker-compose.prod.yml up -d

# 3. Check logs
docker compose -f docker-compose.prod.yml logs -f parver
```

The production compose file pulls the pre-built image from `ghcr.io/splatcrafter/parver:latest` and connects it to a MariaDB 11 instance with a persistent volume.

---

## License & Acknowledgments

**ParVer** is developed by **[Splatgames.de Software](https://splatgames.de)**, represented by Erik Pförtner.

Commissioned by **AFBB Akademie für berufliche Bildung gGmbH**, Dresden, Germany, as part of the LF12 curriculum project.

---

<p align="center">
  <sub>Built with Spring Boot, React, and a lot of parking frustration.</sub>
</p>
