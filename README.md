# 🌍 Susty — Sustainability Social Platform

A modern, community-driven social platform focused on sustainability. Share ideas, take action, participate in a circular economy, and track your real-world environmental impact.

---

## Features

- **Thread-Based Social Feed** — Post, reply, like, repost, hashtags, multimedia
- **Sustainability Marketplace** — Buy, sell, trade used goods with carbon impact tracking
- **Events** — Discover and RSVP to cleanups, workshops, marches, repair cafés
- **Community Groups** — City-based discussion groups with posts and comments
- **Challenges** — Weekly/monthly sustainability challenges with leaderboards
- **Knowledge Hub** — Curated articles and guides (composting, minimalism, energy saving)
- **Donations** — Give away items, request what you need, support others
- **Messaging** — Direct conversations between users
- **Impact Dashboard** — Track CO₂ saved, waste reduced, water conserved
- **Badges & Achievements** — Earn badges based on your activity and impact

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue.js 3 + Vue Router 4 |
| Backend | NestJS 10 + TypeORM 0.3 |
| Database | PostgreSQL 16 |
| Auth | JWT (passport-jwt) + bcrypt |
| Web Server | Nginx (reverse proxy + SPA) |
| Containers | Docker + Docker Compose |
| Runtime | Node.js 18 (Alpine) |

---

## Quick Start (Docker)

The entire stack runs with a single command — no dependencies to install locally besides Docker.

```bash
docker compose up --build
```

This starts three services:

| Service | Description | Port |
|---------|-------------|------|
| **postgres** | PostgreSQL 16 database | 5433 (host) |
| **backend** | NestJS API server | 3000 (internal) |
| **frontend** | Vue.js app via Nginx | **5057** |

Open **http://localhost:5057** in your browser.

> The database tables and seed data (challenges, articles, community groups) are created automatically on first run.

### Stop

```bash
docker compose down
```

To also wipe the database volume:

```bash
docker compose down -v
```

---

## Local Development (Without Docker)

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL running locally

### Frontend

```bash
npm install
npm run serve
```

Dev server starts at `http://localhost:8080`.

### Backend

```bash
cd backend
npm install
npm run start:dev
```

API starts at `http://localhost:3000` with global prefix `/api`.

Set environment variables:

```bash
export DATABASE_URL=postgres://susty:susty_dev_5057@localhost:5432/susty
export JWT_SECRET=susty-jwt-s3cr3t-ch4ng3-1n-pr0d
```

### Setup Script (Ubuntu/Debian)

A convenience script is provided to install Node.js, Vue CLI, and project deps:

```bash
chmod +x setup_plus_run.sh
./setup_plus_run.sh
```

---

## Project Structure

```
susty/
├── docker-compose.yml          # Orchestrates all 3 services
├── Dockerfile                  # Frontend multi-stage build (Node → Nginx)
├── nginx.conf                  # Reverse proxy /api → backend, SPA fallback
├── package.json                # Frontend dependencies
├── vue.config.js               # Webpack/Babel cache config
├── src/
│   ├── main.js                 # Vue app entry
│   ├── App.vue                 # Root component (nav, auth state)
│   ├── router/index.js         # All routes + auth guard
│   ├── services/api.js         # API client (~30 methods)
│   ├── views/
│   │   ├── Home.vue            # Feed — posts, replies, hashtags
│   │   ├── AuthView.vue        # Login / Register
│   │   ├── Marketplace.vue     # Buy/sell/trade listings
│   │   ├── Events.vue          # Event discovery & RSVP
│   │   ├── Community.vue       # Groups, posts, comments
│   │   ├── Messages.vue        # Direct messaging
│   │   ├── Challenges.vue      # Sustainability challenges
│   │   ├── Knowledge.vue       # Articles & guides
│   │   ├── Donations.vue       # Give/request items
│   │   ├── Profile.vue         # Impact dashboard, badges, settings
│   │   └── About.vue           # About the platform
│   ├── components/
│   │   ├── Header.vue
│   │   └── Footer.vue
│   └── assets/
│       └── styles.css           # Global CSS with custom properties
├── backend/
│   ├── Dockerfile              # Single-stage Node 18 build
│   ├── package.json            # NestJS + TypeORM + auth deps
│   └── src/
│       ├── main.ts             # Bootstrap — CORS, validation, /api prefix
│       ├── app.module.ts       # Root module w/ TypeORM config
│       ├── entities.ts         # 15 TypeORM entities
│       ├── auth/               # Register, login, JWT strategy
│       ├── users/              # Profile, stats endpoint
│       ├── posts/              # Feed CRUD + likes/reposts/replies
│       ├── marketplace/        # Listings with filters + carbon calc
│       ├── events/             # Events + RSVP management
│       ├── messages/           # Conversations between users
│       ├── community/          # Groups, posts, comments
│       ├── challenges/         # Challenges + progress + leaderboard
│       ├── knowledge/          # Articles with views/likes
│       └── donations/          # Donations + requests + fulfillment
└── public/
    └── index.html
```

---

## API Endpoints

All endpoints are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <token>`.

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| **Users** | `GET /users/me`, `GET /users/me/stats`, `GET /users/:id`, `PATCH /users/:id` |
| **Posts** | `GET /posts`, `POST /posts`, `DELETE /posts/:id`, `POST /posts/:id/like`, `POST /posts/:id/repost`, `POST /posts/:id/replies` |
| **Marketplace** | `GET /listings`, `POST /listings`, `DELETE /listings/:id` |
| **Events** | `GET /events`, `POST /events`, `POST /events/:id/rsvp`, `DELETE /events/:id/rsvp` |
| **Messages** | `GET /messages`, `GET /messages/:userId`, `POST /messages` |
| **Community** | `GET /community/groups`, `POST /community/groups/:id/join`, `GET /community/posts`, `POST /community/posts`, `POST /community/posts/:id/like`, `POST /community/posts/:id/comments` |
| **Challenges** | `GET /challenges`, `GET /challenges/progress`, `GET /challenges/leaderboard`, `POST /challenges/:id/join`, `POST /challenges/:id/complete` |
| **Knowledge** | `GET /articles`, `GET /articles/:id`, `POST /articles`, `POST /articles/:id/like` |
| **Donations** | `GET /donations`, `GET /donations/stats`, `POST /donations`, `POST /donations/:id/claim`, `GET /donations/requests`, `POST /donations/requests`, `POST /donations/requests/:id/fulfill` |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://susty:susty_dev_5057@postgres:5432/susty` | PostgreSQL connection string |
| `JWT_SECRET` | `susty-jwt-s3cr3t-ch4ng3-1n-pr0d` | JWT signing secret (**change in production**) |

---

## Architecture

```
Browser ──► Nginx (:5057)
               ├── /api/* ──► NestJS Backend (:3000) ──► PostgreSQL (:5432)
               └── /*     ──► Vue.js SPA (static files)
```

- **Nginx** serves the Vue.js build and reverse-proxies `/api` requests to the backend
- **NestJS** handles all business logic, auth, and database access via TypeORM
- **PostgreSQL** stores all data with auto-sync schema (dev mode)
- **JWT auth** with bcrypt password hashing, 7-day token expiry

---

## License

This project is private.
