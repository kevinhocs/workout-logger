const express = require("express");
const cors = require("cors");

const app = express();
// Enable CORS for local development / frontend access
app.use(cors());
// Parse incoming JSON payloads into `req.body`
app.use(express.json());

// Temporary in-memory database (resets when the server restarts).
// For real apps, persist this data in a database instead.
let sessions = [];

// Health-check / root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Gym Tracker API is running" });
});

// Return all workout logs
app.get("/logs", (req, res) => {
  res.json(sessions);
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

  const exerciseLog = {
    id: Date.now().toString(),
    exercise,
    weight,
    reps,
    sets
  };

   let session = sessions.find((s) => s.date === date);

  if (!session) {
    session = {
      id: Date.now().toString(),
      date,
      exercises: [],
    };
    sessions.push(session);
  }

  session.exercises.push(exerciseLog);

  res.status(201).json(session);
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