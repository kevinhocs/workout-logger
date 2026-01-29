## Entities

### Workout
- workout_id (PK)
- workout_date (DATE, UNIQUE, NOT NULL)

### Exercise
- exercise_id (PK)
- name (TEXT, UNIQUE, NOT NULL)

### ExerciseLog
- log_id (PK)
- workout_id (FK -> Workout.workout_id)
- exercise_id (FK -> Exercise.exercise_id)
- weight_lbs_kg (REAL, NOT NULL)
- reps (INTEGER, NOT NULL)
- sets (INTEGER, NOT NULL)