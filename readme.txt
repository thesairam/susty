SUSTY — Sustainability Social Platform
=======================================

Quick Start (Docker — Recommended)
-----------------------------------
Prerequisites: Docker and Docker Compose installed.

  docker compose up --build

Open http://localhost:5057 in your browser.
Database, seed data, and all services start automatically.

To stop:

  docker compose down

To stop and wipe the database:

  docker compose down -v


Services
--------
  Frontend   http://localhost:5057   Vue.js 3 via Nginx
  Backend    internal :3000          NestJS API (proxied through /api)
  Database   localhost:5433          PostgreSQL 16


Local Development (Without Docker)
------------------------------------
Prerequisites: Node.js 18+, npm, PostgreSQL.

Frontend:

  npm install
  npm run serve

Backend:

  cd backend
  npm install
  export DATABASE_URL=postgres://susty:susty_dev_5057@localhost:5432/susty
  export JWT_SECRET=susty-jwt-s3cr3t-ch4ng3-1n-pr0d
  npm run start:dev


Setup Script (Ubuntu/Debian)
------------------------------
A convenience script installs Node.js, Vue CLI, and project deps:

  chmod +x setup_plus_run.sh
  ./setup_plus_run.sh


Pages
-----
  /            Home feed (posts, replies, hashtags)
  /auth        Login / Register
  /marketplace Buy, sell, trade used goods
  /events      Sustainability events & RSVP
  /community   Local groups, posts, comments
  /messages    Direct messaging
  /challenges  Weekly/monthly challenges & leaderboards
  /knowledge   Articles & guides
  /donations   Give away or request items
  /profile     Impact dashboard, badges, settings
  /about       About the platform


API
---
All endpoints prefixed with /api. Auth routes require Bearer token.

  POST /api/auth/register         Register new user
  POST /api/auth/login            Login, returns JWT
  GET  /api/auth/me               Current user profile
  GET  /api/users/me/stats        Impact & activity stats
  GET  /api/posts                 Social feed
  GET  /api/listings              Marketplace listings
  GET  /api/events                Events list
  GET  /api/messages              Conversations
  GET  /api/community/groups      Community groups
  GET  /api/challenges            Active challenges
  GET  /api/articles              Knowledge hub articles
  GET  /api/donations             Available donations


Environment Variables
---------------------
  DATABASE_URL   PostgreSQL connection string
  JWT_SECRET     JWT signing secret (change in production)
