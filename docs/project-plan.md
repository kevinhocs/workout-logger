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
- Persist workout data across sessions

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
- Delete a workout
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
- API: RESTful JSON-based API
- Storage: Backend-managed persistent storage

## Data Model (Planned)

### Workout
- id: string (unique identifier)
- exerciseName: string
- sets: number
- reps: number
- weight: number
- weightUnit: string ("lbs" or "kg")
- date: ISO date string

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

## Validation Rules (Planned)

- Exercise name is required and must be non-empty
- Sets and reps must be positive integers
- Weight must be a non-negative number
- Date must be a valid date value

## User Interface Overview

### Log Workout Screen
Elements:
- Exercise name input
- Sets input
- Reps input
- Weight input
- Date input
- Submit button

Behavior:
- Validate input on submission
- Display error messages on invalid input
- Redirect to workout history on success

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