# Workout Logger



A single-user full-stack workout logging application focused on correctness, input validation, and realistic domain constraints rather than UI complexity.

## What it does

- Logs workouts composed of exercises, sets, reps, and weight
- Enforces basic domain constraints (valid ranges, required fields)
- Validates input before persistence
- Stores and retrieves workout data via a REST API
- Backend persistence is currently being migrated from in-memory storage to SQLite with a normalized relational schema


## Tech Stack

- Frontend: React

- Backend: Node.js, Express (SQLite migration in progress)

- API: REST (JSON)



## Structure

- Frontend: React client

- Backend: Express API

## Design

Pre-implementation planning and design decisions are documented in `/docs/project-plan.md`.

## Notes

This project is intended as a portfolio piece demonstrating core full-stack fundamentals, including state management, validation, and backend API design.

## How to Run

### Prerequisites
- Node.js (v18+ recommended)
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

