PRAGMA foreign_keys = ON;

-- =========================
-- Workout Table
-- =========================
CREATE TABLE workout (
workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
workout_date TEXT NOT NULL UNIQUE
);

-- =========================
-- Exercise Table
-- =========================
CREATE TABLE exercise (
    exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- =========================
-- Exercise_Log Table
-- =========================
CREATE TABLE exercise_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    weight_lbs REAL NOT NULL CHECK (weight_lbs >= 0),
    reps INTEGER NOT NULL CHECK (reps > 0),
    sets INTEGER NOT NULL CHECK (sets > 0),
    
FOREIGN KEY (workout_id)
    REFERENCES workout (workout_id)
    ON DELETE CASCADE,

FOREIGN KEY (exercise_id)
    REFERENCES exercise (exercise_id)
    ON DELETE RESTRICT
);