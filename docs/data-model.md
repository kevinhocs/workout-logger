## Entities

### Workout
Represents a workout session.

- workout_id (PK)
- workout_date (DATE, UNIQUE, NOT NULL)
- bodyweight_lbs (REAL)

### Exercise
Reusable exercise definition.

- exercise_id (PK)
- name (TEXT, UNIQUE, NOT NULL)

### Sets
Represents an individual working set performed during a workout.

- set_id (PK)
- workout_id (FK → Workout.workout_id)
- exercise_id (FK → Exercise.exercise_id)
- set_number (INTEGER)
- weight_lbs (REAL)
- reps (INTEGER)

## Relationships
- Workout (1) - (many) Sets
- Exercise (1) - (many) Sets

## Design Decisions

- Workouts are explicitly created via the API and uniquely identified by date.
- Exercises are normalized to avoid duplication.
- Individual sets are stored as separate records to allow variation in weight and reps per set.
- Weight is stored in pounds as the canonical unit; the frontend performs unit conversion for display.
- The schema supports accurate volume calculation and flexible workout structures.