const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'workout.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Could not connect to database', err.message);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");

    db.run(`
        CREATE TABLE IF NOT EXISTS workout (
            workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_date TEXT NOT NULL UNIQUE,
            bodyweight_lbs REAL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS exercise (
            exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS exercise_log (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_id INTEGER NOT NULL,
            exercise_id INTEGER NOT NULL,
            weight_lbs REAL NOT NULL,
            reps INTEGER NOT NULL,
            sets INTEGER NOT NULL,
            FOREIGN KEY (workout_id) REFERENCES workout(workout_id) ON DELETE CASCADE,
            FOREIGN KEY (exercise_id) REFERENCES exercise(exercise_id) ON DELETE CASCADE
        )
    `);
});


module.exports = db;