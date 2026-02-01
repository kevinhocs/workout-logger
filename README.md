# Workout Logger



A single-user full-stack workout logging application focused on correctness, input validation, and realistic domain constraints rather than UI complexity.

## What it does

- Logs workouts composed of exercises, sets, reps, and weight
- Enforces basic domain constraints (valid ranges, required fields)
- Validates input before persistence
- Stores and retrieves workout data via a REST API
- Persists workout data using SQLite with normalized relational schema


## Tech Stack

- Frontend: React

- Backend: Node.js, Express, SQLite

- API: REST (JSON)


## Architecture & Data Model

The backend uses a normalized relational schema backed by SQLite.
Workout data is organized across three core entities:

- **Workout** — represents a workout session, uniquely identified by date
- **Exercise** — reusable exercise definitions
- **ExerciseLog** — junction table storing sets, reps, and weight per exercise per workout

Foreign key constraints and cascading deletes are enforced at the database level.
The schema and ERD are documented in `/docs/data-model.md`.



## Structure

- Frontend: React client

- Backend: Express API

## Design

Pre-implementation planning and design decisions are documented in `/docs/project-plan.md`.

## Notes

This project is intended as a portfolio piece demonstrating core full-stack fundamentals, including state management, input validation, transactional database writes, and REST API design.

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

