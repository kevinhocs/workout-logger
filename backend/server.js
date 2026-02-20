const express = require("express");
const cors = require("cors");
const db = require('./db');

const app = express();
// Enable CORS for local development / frontend access
app.use(cors());
// Parse incoming JSON payloads into `req.body`
app.use(express.json());

// SQLite-backed persistent using a normalized schema

app.get("/", (req, res) => {
  res.json({ message: "Gym Tracker API is running" });
});

// Return all workout logs
app.get("/logs", (req, res) => {
  const sql = `
    SELECT
    w.workout_id,
    w.workout_date,
    l.log_id,
    e.name AS exercise,
    l.weight_lbs,
    l.reps,
    l.sets
    FROM workout w
    JOIN exercise_log l ON w.workout_id = l.workout_id
    JOIN exercise e ON l.exercise_id = e.exercise_id
    ORDER BY w.workout_date DESC, l.log_id ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to retrieve logs" });
    }

    const sessions = {};

    for (const row of rows) {
      const workoutId = row.workout_id;

      if (!sessions[workoutId]) {
        sessions[workoutId] = {
          id: workoutId,
          date: row.workout_date,
          exercises: []
        };
      }

      sessions[workoutId].exercises.push({
        id: row.log_id,
        exercise: row.exercise,
        weight: row.weight_lbs,
        reps: row.reps,
        sets: row.sets
      });
    }
  
    res.json(Object.values(sessions));
  });
});

// Create a new exercise log entry (creates workouts/exercises as needed)
app.post("/logs", (req, res) => {
  const {date, exercise, weight, reps, sets} = req.body;

  if (!date || !exercise || weight == null || reps == null || sets == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(d.getTime()) || d > today) {
    return res.status(400).json({ error: "Invalid date" });
  }

  if (
    typeof weight !== "number" ||
    typeof reps !== "number" ||
    typeof sets !== "number" ||
    weight < 0 ||
    reps <= 0 ||
    sets <= 0
  ) {
    return res.status(400).json({ error: "Invalid numeric values" });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");

    db.run(
      "INSERT OR IGNORE INTO workout (workout_date) VALUES (?)",
      [date],
      (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Failed to create workout" });
        }

        db.get(
          "SELECT workout_id FROM workout WHERE workout_date = ?",
          [date],
          (err, row) => {
            if (err || !row) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Failed to retrieve workout" });
            }

            const workoutId = row.workout_id;
            db.run(
              "INSERT OR IGNORE INTO exercise (name) VALUES (?)",
              [exercise],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: "Failed to create exercise" });
                }

                db.get(
                  "SELECT exercise_id FROM exercise WHERE name = ?",
                  [exercise],
                  (err, row) => {
                    if (err || !row) {
                      db.run("ROLLBACK");
                      return res.status(500).json({ error: "Failed to retrieve exercise" });
                    }

                    const exerciseId = row.exercise_id;
                    db.run(
                      "INSERT INTO exercise_log (workout_id, exercise_id, weight_lbs, reps, sets) VALUES (?, ?, ?, ?, ?)",
                      [workoutId, exerciseId, weight, reps, sets],
                      function (err) {
                      if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: "Failed to create exercise log" });
                      }

                      db.run("COMMIT");

                      res.status(201).json({
                        id: this.lastID.toString(),
                        date,
                        exercise,
                        weight_lbs: weight,
                        reps,
                        sets
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});
});

// Delete a log by id
app.delete("/logs/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM exercise_log WHERE log_id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to delete log" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Log not found" });
      }

      res.json({ message: "Log deleted successfully" });
    }
  );
});

// Update a log by id
app.put("/logs/:id", (req, res) => {
  const { id } = req.params;
  const {exercise, weight, reps, sets} = req.body;

  if (!exercise || weight == null || reps == null || sets == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    typeof weight !== "number" ||
    typeof reps !== "number" ||
    typeof sets !== "number" ||
    weight < 0 ||
    reps <= 0 ||
    sets <= 0
  ) {
    return res.status(400).json({ error: "Invalid numeric values" });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");

    db.run(
      "INSERT OR IGNORE INTO exercise (name) VALUES (?)",
      [exercise],
      (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Failed to create exercise" });
        }

        db.get(
          "SELECT exercise_id FROM exercise WHERE name = ?",
          [exercise],
          (err, row) => {
            if (err || !row) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Failed to retrieve exercise" });
            }

            const exerciseId = row.exercise_id;

            db.run(
              `
              UPDATE exercise_log 
              SET exercise_id = ?, weight_lbs = ?, reps = ?, sets = ? 
              WHERE log_id = ?
              `,
              [exerciseId, weight, reps, sets, id],
              function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: "Failed to update exercise log" });
                }

                if (this.changes === 0) {
                  db.run("ROLLBACK");
                  return res.status(404).json({ error: "Log not found" });
                }

                db.run("COMMIT");

                res.json({
                  id,
                  exercise,
                  weight_lbs: weight,
                  reps,
                  sets
                });
              }
            );
          }
        );
      }
    );
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port:${PORT}`);
});