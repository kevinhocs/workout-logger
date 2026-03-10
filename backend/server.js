const express = require("express");
const cors = require("cors");
const db = require("./db");
const helmet = require("helmet");

const app = express();
if (process.env.NODE_ENV === "development") {
  app.use(cors());
}

app.use(helmet());

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Gym Tracker API is running" });
});

app.get("/api/logs", (req, res) => {
  const sql = `
    SELECT
      w.workout_id,
      w.workout_date,
      w.bodyweight_lbs,
      s.set_id,
      s.set_number,
      e.name AS exercise,
      s.weight_lbs,
      s.reps
    FROM workout w
    JOIN sets s ON w.workout_id = s.workout_id
    JOIN exercise e ON s.exercise_id = e.exercise_id
    ORDER BY w.workout_date DESC, e.name ASC, s.set_number ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("SQLite error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const sessions = {};

    for (const row of rows) {
      const workoutId = row.workout_id;

      if (!sessions[workoutId]) {
        sessions[workoutId] = {
          id: workoutId,
          date: row.workout_date,
          bodyweight_lbs: row.bodyweight_lbs,
          exercises: {},
        };
      }

      if (!sessions[workoutId].exercises[row.exercise]) {
        sessions[workoutId].exercises[row.exercise] = {
          name: row.exercise,
          sets: [],
        };
      }

      sessions[workoutId].exercises[row.exercise].sets.push({
        id: row.set_id,
        weight: row.weight_lbs,
        reps: row.reps,
      });
    }

    for (const session of Object.values(sessions)) {
      session.exercises = Object.values(session.exercises);

      for (const exercise of session.exercises) {
        exercise.sets.sort((a, b) => a.id - b.id);

        exercise.sets.forEach((set, index) => {
          set.set_number = index + 1;
        });
      }
    }

    const sortedSessions = Object.values(sessions).sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    res.json(sortedSessions);
  });
});

app.post("/api/logs", (req, res) => {
  const { date, exercise, weight, reps, sets, bodyweight } = req.body;

  let normalizedSets = [];
  if (Array.isArray(sets)) {
    normalizedSets = sets;
  } else if (
    Number.isInteger(sets) &&
    sets > 0 &&
    typeof weight === "number" &&
    typeof reps === "number"
  ) {
    normalizedSets = Array.from({ length: sets }, () => ({ weight, reps }));
  }

  if (
    !date ||
    !exercise ||
    normalizedSets.length === 0 ||
    bodyweight == null
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(d.getTime()) || d > today) {
    return res.status(400).json({ error: "Invalid date" });
  }

  if (
    typeof bodyweight !== "number" ||
    bodyweight <= 0
  ) {
    return res.status(400).json({ error: "Invalid numeric values" });
  }

  for (const s of normalizedSets) {
    if (
      typeof s.weight !== "number" ||
      typeof s.reps !== "number" ||
      s.weight < 0 ||
      s.reps <= 0
    ) {
      return res.status(400).json({ error: "Invalid set values" });
    }
  }

  db.run(
    `INSERT INTO workout (workout_date, bodyweight_lbs) VALUES (?, ?)
      ON CONFLICT(workout_date) DO UPDATE SET bodyweight_lbs = excluded.bodyweight_lbs`,
    [date, bodyweight],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to create workout" });
      }

      db.get(
        "SELECT workout_id FROM workout WHERE workout_date = ?",
        [date],
        (err, row) => {
          if (err || !row) {
            return res
              .status(500)
              .json({ error: "Failed to retrieve workout" });
          }

          if (typeof bodyweight === "number" && bodyweight > 0) {
            db.run(
              "UPDATE workout SET bodyweight_lbs = ? WHERE workout_id = ?",
              [bodyweight, row.workout_id],
              (err) => {
                if (err) {
                  return res
                    .status(500)
                    .json({ error: "Failed to update bodyweight" });
                }
              },
            );
          }

          const workoutId = row.workout_id;
          db.run(
            "INSERT OR IGNORE INTO exercise (name) VALUES (?)",
            [exercise],
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Failed to create exercise" });
              }

              db.get(
                "SELECT exercise_id FROM exercise WHERE name = ?",
                [exercise],
                (err, row) => {
                  if (err || !row) {
                    return res
                      .status(500)
                      .json({ error: "Failed to retrieve exercise" });
                  }

                  const exerciseId = row.exercise_id;
                  let inserted = 0;

                  normalizedSets.forEach((set, index) => {
                    db.run(
                      "INSERT INTO sets (workout_id, exercise_id, set_number, weight_lbs, reps) VALUES (?, ?, ?, ?, ?)",
                      [workoutId, exerciseId, index + 1, set.weight, set.reps],
                      function (err) {
                        if (err) {
                          return res.status(500).json({ error: "Failed to create set" });
                        }

                        inserted++;

                        if (inserted === normalizedSets.length) {
                          res.status(201).json({
                            date,
                            exercise,
                            sets: normalizedSets.length,
                            bodyweight_lbs: bodyweight,
                          });
                        }
                      },
                    );
                  });
                },
              );
            },
          );
        },
      );
    },
  );
});

app.delete("/api/logs/:id", (req, res) => {
  const { id } = req.params;

  db.get(
    "SELECT workout_id, exercise_id FROM sets WHERE set_id = ?",
    [id],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "Set not found" });
      }

      const { workout_id, exercise_id } = row;

      db.run(
        "DELETE FROM sets WHERE workout_id = ? AND exercise_id = ?",
        [workout_id, exercise_id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Failed to delete exercise sets" });
          }

          db.get(
            "SELECT COUNT(*) AS count FROM sets WHERE workout_id = ?",
            [workout_id],
            (err, result) => {
              if (err) {
                return res.status(500).json({ error: "Failed to check workout" });
              }

              if (result.count === 0) {
                db.run("DELETE FROM workout WHERE workout_id = ?", [workout_id]);
              }

              res.status(204).send();
            },
          );
        },
      );
    },
  );
});

app.delete("/api/workouts/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM workout WHERE workout_id = ?",
    [id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete workout" });
      }

      res.status(204).send();
    }
  );
});

// Update a log by id
app.put("/api/exercises/:id", (req, res) => {
  const { id } = req.params;
  const { exercise, sets, bodyweight } = req.body;

  if (!exercise || !Array.isArray(sets) || sets.length === 0 || bodyweight == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  for (const s of sets) {
    if (
      typeof s.weight !== "number" ||
      typeof s.reps !== "number" ||
      s.weight < 0 ||
      s.reps <= 0
    ) {
      return res.status(400).json({ error: "Invalid set values" });
    }
  }

  db.get(
    "SELECT workout_id, exercise_id FROM sets WHERE set_id = ?",
    [id],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "Set not found" });
      }

      const { workout_id } = row;

      db.run(
        "UPDATE workout SET bodyweight_lbs = ? WHERE workout_id = ?",
        [bodyweight, workout_id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to update bodyweight" });
          }

          db.run(
            "INSERT OR IGNORE INTO exercise (name) VALUES (?)",
            [exercise],
            (err) => {
              if (err) {
                return res.status(500).json({ error: "Failed creating exercise" });
              }

              db.get(
                "SELECT exercise_id FROM exercise WHERE name = ?",
                [exercise],
                (err, exerciseRow) => {
                  if (err || !exerciseRow) {
                    return res.status(500).json({ error: "Exercise lookup failed" });
                  }

                  const exerciseId = exerciseRow.exercise_id;

                  db.run(
                    "DELETE FROM sets WHERE workout_id = ? AND exercise_id = ?",
                    [workout_id, exerciseId],
                    (err) => {
                      if (err) {
                        return res.status(500).json({ error: "Failed clearing sets" });
                      }

                      let inserted = 0;

                      sets.forEach((set, index) => {
                        db.run(
                          "INSERT INTO sets (workout_id, exercise_id, set_number, weight_lbs, reps) VALUES (?, ?, ?, ?, ?)",
                          [workout_id, exerciseId, index + 1, set.weight, set.reps],
                          function (err) {
                            if (err) {
                              return res.status(500).json({ error: "Insert failed" });
                            }

                            inserted++;

                            if (inserted === sets.length) {
                              res.json({ success: true });
                            }
                          },
                        );
                      });
                    },
                  );
                },
              );
            },
          );
        },
      );
    },
  );
});

const PORT = process.env.PORT || 3000;

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port:${PORT}`);
});
