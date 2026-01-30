const express = require("express");
const cors = require("cors");
const db = require('./db');

const app = express();
// Enable CORS for local development / frontend access
app.use(cors());
// Parse incoming JSON payloads into `req.body`
app.use(express.json());

// Temporary in-memory database (resets when the server restarts).

// Health-check / root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Gym Tracker API is running" });
});

// Return all workout logs
app.get("/logs", (req, res) => {
  
});

// Create a new workout log. ID is a timestamp string -
// simple but not collision-proof. Use UUIDs in real apps.
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

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const before = session.exercises.length;

    session.exercises = session.exercises.filter(
      (log) => log.id !== id
    );

    if (session.exercises.length < before) {
      if (session.exercises.length === 0) {
        sessions.splice(i, 1);
      }

      return res.json({ message: "Log deleted" });
    }
  }

  res.status(404).json({ error: "Log not found" });
});

// Update a log by id
app.put("/logs/:id", (req, res) => {
  const { id } = req.params;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No update data provided" });
  }

  const allowedFields = ["exercise", "weight", "reps", "sets"];

  for (const key of Object.keys(req.body)) {
    if (!allowedFields.includes(key)) {
      return res.status(400).json({ error: `Invalid field: ${key}` });
    }
  }

  if ("weight" in req.body && (typeof req.body.weight !== "number" || req.body.weight < 0)) {
    return res.status(400).json({ error: "Invalid weight value" });
  }

  if ("reps" in req.body && (typeof req.body.reps !== "number" || req.body.reps <= 0)) {
    return res.status(400).json({ error: "Invalid reps value" });
  }

  if ("sets" in req.body && (typeof req.body.sets !== "number" || req.body.sets <= 0)) {
    return res.status(400).json({ error: "Invalid sets value" });
  }

  for (const session of sessions) {
    const exercise = session.exercises.find(ex => ex.id === id);
    if (exercise) {
      Object.assign(exercise, req.body);
      return res.json(exercise);
    }
  }

  return res.status(404).json({ error: "Log not found" });
});

// Start the server

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});