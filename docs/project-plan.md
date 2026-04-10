# Project Plan (Pre-Implementation)

This document outlines the intended design and scope of the project prior to implementation.

## Overview

This project is a web-based workout tracker application designed for a single user to log, view, and manage workout sessions. The application focuses on core CRUD functionality and prioritizes simplicity, clarity, and maintainability over advanced features.

The goal of the MVP is to provide a minimal and reliable system for recording workouts and reviewing workout history. The project is intended as a portfolio piece demonstrating full-stack fundamentals and basic system design.

## Goals and Non-Goals

### Goals
- Implement full CRUD functionality for workout entries
- Maintain a simple and understandable architecture
- Demonstrate clear separation between frontend and backend
- Persist workout data using a relational database

### Non-Goals
- User authentication or authorization
- Multi-user support
- Social or sharing features
- Advanced analytics or reporting
- Mobile application support
- Cloud-based synchronization

## Scope

### In Scope (MVP)
- Log a workout
- View workout history
- Edit an existing workout
- Delete individual exercises
- Delete entire workout sessions
- Persistent storage
- Basic input validation

### Out of Scope
- Authentication
- Multiple users
- Social features
- Advanced analytics
- Mobile app
- Cloud sync

## Architecture Overview

- Frontend: React single-page application
- Backend: Node.js with Express
- API: RESTful JSON API (single-user, no authentication)
- Storage: SQLite-based relational database

## Data Model (Planned)

The application uses a normalized relational schema designed to support
workout sessions, reusable exercises, and per-set tracking.

### Workout
Represents a workout session.

- workout_id (PK)
- workout_date (DATE, UNIQUE, NOT NULL)
- bodyweight_lbs (REAL, NOT NULL)

### Exercise
Represents a reusable exercise definition.

- exercise_id (PK)
- name (TEXT, UNIQUE, NOT NULL)

### Set
Represents an individual working set performed during a workout.

- set_id (PK)
- workout_id (FK → Workout.workout_id)
- exercise_id (FK → Exercise.exercise_id)
- set_number (INTEGER)
- weight_lbs (REAL)
- reps (INTEGER)

## Actors

- User (single, non-authenticated)

## Functional Requirements

### Use Case 1: Log Workout
Actor: User

Goal: Record a new workout entry.

Flow:
1. User opens the log workout screen
2. User enters workout details
3. User submits the form
4. System validates input
5. System stores the workout
6. Workout appears in workout history

### Use Case 2: View Workout History
Actor: User

Goal: View previously logged workouts.

Flow:
1. User navigates to workout history
2. System retrieves stored workouts
3. System displays workouts in chronological order

### Use Case 3: Edit Workout
Actor: User

Goal: Modify an existing workout entry.

Flow:
1. User selects a workout from history
2. User selects edit
3. System displays pre-filled workout data
4. User modifies fields
5. User saves changes
6. System updates the workout
7. Updated workout appears in history

### Use Case 4: Delete Workout
Actor: User

Goal: Delete a workout entry.

Flow:
1. User selects a workout from history
2. User selects delete
3. System removes the workout
4. Workout no longer appears in history

## Validation Rules

- Exercise name must be non-empty
- Each set must contain weight and reps
- Reps must be positive integers
- Weight must be a non-negative number
- Bodyweight must be a positive number
- Date must not be in the future

## User Interface Overview

### Log Workout Screen

Elements:
- Exercise name input
- Weight input
- Reps input
- Set tracking inputs
- Workout date input

Behavior:
- Users can dynamically add or remove sets
- Each set records weight and reps independently
- Input validation occurs on submission
- Workout history updates after submission

### Workout History Screen
Elements:
- List of workout entries
- Edit button per entry
- Delete button per entry

Behavior:
- Display all stored workouts
- Support edit and delete actions per entry

## Future Enhancements

- Additional exercise metadata
- Improved filtering or analytics
- Authentication and multi-user support

## Project Evolution

### Phase 1 - CRUD MVP

- Full-stack React + Express app
- SQLite persistence
- Single-user design
- Local development

### Phase 2 – Production Deployment

- Deployed to AWS EC2
- Nginx reverse proxy
- HTTPS with Let's Encrypt
- Live SQLite database persisted on EC2 instance
- Remote access via domain
- Manual deployment workflow (git pull, frontend rebuild, Nginx update, PM2 restart)

### Phase 3 - Analytics & Modeling Layer (In Progress)
#### Completed
- Separate Python analytics engine
- Read-only connection to production SQLite DB
- Schema validation & invariant checks
- Per-exercise descriptive statistics

#### Planned
- Baseline next-session forecasting
- Long-term trend modeling
- Chronological rolling evaluation
- Error measurement (MAE)
- Model comparison against baseline

#### Modeling Scope
- Within-user longitudinal modeling only
- Predict next-session top set weight per exercise
- Estimate long-term strength trend over time
- Predictions are statistical estimates, not prescriptive advice

#### Assumptions
- Stable training structure
- No major injury regime changes
- Similar recovery conditions across sessions
- Single-user local data persistence (no synchronization across devices)