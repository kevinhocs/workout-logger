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
      w.name,
      w.completed,
      s.set_id,
      s.set_number,
      e.name AS exercise,
      s.weight_lbs,
      s.reps,
      s.notes
    FROM workout w
    LEFT JOIN sets s ON w.workout_id = s.workout_id
    LEFT JOIN exercise e ON s.exercise_id = e.exercise_id
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
          name: row.name,
          bodyweight_lbs: row.bodyweight_lbs,
          completed: row.completed,
          exercises: {},
        };
      }

      if (row.name) {
        sessions[workoutId].name = row.name;
      }

      if (row.exercise) {
        if (!sessions[workoutId].exercises[row.exercise]) {
          sessions[workoutId].exercises[row.exercise] = {
            name: row.exercise,
            notes: null,
            sets: [],
          };
        }

        if (!sessions[workoutId].exercises[row.exercise].notes && row.notes) {
          sessions[workoutId].exercises[row.exercise].notes = row.notes;
        }

        if (row.set_id) {
          sessions[workoutId].exercises[row.exercise].sets.push({
            id: row.set_id,
            weight: row.weight_lbs,
            reps: row.reps,
          });
        }
      }
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

app.post("/api/workouts", (req, res) => {
  const { date, name, bodyweight } = req.body;

  if (!date || !name || name.trim() === "" || bodyweight == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  if (typeof bodyweight !== "number" || bodyweight <= 0) {
    return res.status(400).json({ error: "Invalid bodyweight" });
  }

  db.serialize(() => {
    db.run("UPDATE workout SET completed = 1 WHERE completed = 0");

    db.run(
      `INSERT INTO workout (workout_date, bodyweight_lbs, name, completed)
       VALUES (?, ?, ?, 0)`,
      [date, bodyweight, name],
      function (err) {
        if (err) {
          console.error("CREATE WORKOUT ERROR:", err);
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          workout_id: this.lastID,
        });
      },
    );
  });
});

app.post("/api/logs", (req, res) => {
  const { workout_id, exercise, sets, notes } = req.body;

  const normalizedSets = Array.isArray(sets) ? sets : [];

  if (!workout_id || !exercise || normalizedSets.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
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
    "INSERT OR IGNORE INTO exercise (name) VALUES (?)",
    [exercise],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to create exercise" });
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

          db.get(
            `SELECT MAX(set_number) AS maxSet
             FROM sets
             WHERE workout_id = ? AND exercise_id = ?`,
            [workout_id, exerciseId],
            (err, maxRow) => {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Failed to get max set number" });
              }

              const start = maxRow && maxRow.maxSet ? maxRow.maxSet : 0;
              let index = 0;

              function insertNext() {
                if (index >= normalizedSets.length) {
                  return res.status(201).json({
                    workout_id,
                    exercise,
                    sets: normalizedSets.length,
                  });
                }

                const set = normalizedSets[index];

                db.run(
                  `INSERT INTO sets (workout_id, exercise_id, set_number, weight_lbs, reps, notes)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    workout_id,
                    exerciseId,
                    start + index + 1,
                    set.weight,
                    set.reps,
                    index === 0 ? notes || null : null,
                  ],
                  function (err) {
                    if (err) {
                      return res
                        .status(500)
                        .json({ error: "Failed to create set" });
                    }

                    index++;
                    insertNext();
                  },
                );
              }

              insertNext();
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
            return res
              .status(500)
              .json({ error: "Failed to delete exercise sets" });
          }

          db.get(
            "SELECT COUNT(*) AS count FROM sets WHERE workout_id = ?",
            [workout_id],
            (err, result) => {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Failed to check workout" });
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

  db.run("DELETE FROM sets WHERE workout_id = ?", [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete sets" });
    }

    db.run("DELETE FROM workout WHERE workout_id = ?", [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete workout" });
      }

      res.status(204).send();
    });
  });
});

app.patch("/api/workouts/:id/complete", (req, res) => {
  const { id } = req.params;

  db.run(
    "UPDATE workout SET completed = 1 WHERE workout_id = ?",
    [id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to complete workout" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Workout not found" });
      }

      res.json({ success: true });
    },
  );
});

app.put("/api/exercises/:id", (req, res) => {
  const { id } = req.params;
  const { exercise, sets, bodyweight, notes } = req.body;

  if (
    !exercise ||
    !Array.isArray(sets) ||
    sets.length === 0 ||
    bodyweight == null
  ) {
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
            return res
              .status(500)
              .json({ error: "Failed to update bodyweight" });
          }

          db.run(
            "INSERT OR IGNORE INTO exercise (name) VALUES (?)",
            [exercise],
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Failed creating exercise" });
              }

              db.get(
                "SELECT exercise_id FROM exercise WHERE name = ?",
                [exercise],
                (err, exerciseRow) => {
                  if (err || !exerciseRow) {
                    return res
                      .status(500)
                      .json({ error: "Exercise lookup failed" });
                  }

                  const exerciseId = exerciseRow.exercise_id;

                  db.run(
                    "DELETE FROM sets WHERE workout_id = ? AND exercise_id = ?",
                    [workout_id, exerciseId],
                    (err) => {
                      if (err) {
                        return res
                          .status(500)
                          .json({ error: "Failed clearing sets" });
                      }

                      let index = 0;

                      function insertNext() {
                        if (index >= sets.length) {
                          return res.json({ success: true });
                        }

                        const set = sets[index];

                        db.run(
                          "INSERT INTO sets (workout_id, exercise_id, set_number, weight_lbs, reps, notes) VALUES (?, ?, ?, ?, ?, ?)",
                          [
                            workout_id,
                            exerciseId,
                            index + 1,
                            set.weight,
                            set.reps,
                            set.notes || null,
                          ],
                          function (err) {
                            if (err) {
                              return res
                                .status(500)
                                .json({ error: "Insert failed" });
                            }

                            index++;
                            insertNext();
                          },
                        );
                      }

                      insertNext();
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
