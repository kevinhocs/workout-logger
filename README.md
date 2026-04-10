# Workout Logger



A production-deployed full-stack workout logging application focused on backend correctness, data integrity, and realistic domain constraints rather than UI complexity.

Live: https://kevinho.dev/
Source: https://github.com/kevinhocs/workout-logger

## Overview

- Logs workouts by recording individual working sets per exercise within each workout session.
- Enforces domain constraints through frontend validation and backend verification.
- Stores and retrieves workout data via a REST API.
- Persists workout data using SQLite with normalized relational schema.
- Runs in a production environment with HTTPS and reverse proxy routing.

The project prioritizes backend correctness and deployment realism over UI complexity.

## Tech Stack

- Frontend: React (Vite production build)
- Backend: Node.js, Express, SQLite
- Infrastructure: AWS EC2 (Amazon Linux), Nginx, PM2, HTTPS, TLS

## Production Architecture

The application is deployed on an AWS EC2 instance (Amazon Linux) with Nginx acting as a reverse proxy in front of the Node.js backend.

### Request Flow
```
Browser (HTTPS)
↓
Nginx (TLS termination + static React build)
↓
HTTP (localhost:3000)
↓
Express API
↓
SQLite database
```

### Deployment Details
- HTTPS is terminated at Nginx using a Let's Encrypt certificate.
- Nginx serves the optimized React production build as static assets.
- Requests to `/api/*` are proxied to the Express backend running on `localhost:3000`.
- The Node.js backend runs under PM2 with `NODE_ENV=production`.
- SQLite persists data locally on the EC2 instance with foreign key enforcement enabled.
- SQLite is used as a lightweight local database; no external database service is used.
- Deployment updates are performed manually by pulling from GitHub, rebuilding the frontend (`npm run build`), copying build files to Nginx, and restarting the backend process.

This separation allows Nginx to handle TLS, static file serving, and request routing while the Express application focuses on API logic and database interaction.

## Architecture & Data Model

The backend uses a normalized relational schema backed by SQLite.
Workout data is organized across three core entities:

- **Workout** — represents a workout session (grouped by date)
- **Exercise** — reusable exercise definitions
- **Set** — an individual working set linking an exercise to a workout

Each set records weight and repetitions independently, allowing variation across sets and enabling accurate training volume calculations.

Foreign key constraints and cascading deletes are enforced at the database level.
The schema is documented in `/docs/data-model.md`.



## Structure
```
frontend/ React client
backend/ Express REST API
docs/ Design documentation
```

## Design

Pre-implementation planning and design decisions are documented in `/docs/project-plan.md`.

## How to Run

### Running Locally
- Node.js (v20+ recommended)
- npm

## Backend
```bash
cd backend
npm install
npm start
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```