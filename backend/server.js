// Simple Express server for a tiny Gym Tracker API.
// Good for learning and prototyping; replace with a
// production-ready structure and persistent DB later.
const express = require("express");
const cors = require("cors");

const app = express();
// Enable CORS for local development / frontend access
app.use(cors());
// Parse incoming JSON payloads into `req.body`
app.use(express.json());

// Temporary in-memory database (resets when the server restarts).
// For real apps, persist this data in a database instead.
let workoutLogs = [];

// Health-check / root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Gym Tracker API is running" });
});

// Return all workout logs
app.get("/logs", (req, res) => {
  res.json(workoutLogs);
});

// Create a new workout log. ID is a timestamp string -
// simple but not collision-proof. Use UUIDs in real apps.
app.post("/logs", (req, res) => {
  const {date, exercise, weight, reps, sets} = req.body;

  if (!date || !exercise || weight == null || reps == null || sets == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (
    typeof weight !== "number" ||
    typeof reps !== "number" ||
    typeof sets !== "number" ||
    weight <= 0 ||
    reps <= 0 ||
    sets <= 0
  ) {
    return res.status(400).json({ error: "Invalid numeric values" });
  }

  const log = {
    id: Date.now().toString(),
    date,
    exercise,
    weight,
    reps,
    sets
  };

  workoutLogs.push(log);
  res.status(201).json(log);
});

// Delete a log by id
app.delete("/logs/:id", (req, res) => {
  const { id } = req.params;

  const before = workoutLogs.length;
  workoutLogs = workoutLogs.filter(log => log.id !== id);

  if (workoutLogs.length === before) {
    return res.status(404).json({ error: "Log not found" });
  }

  res.json({ message: "Log deleted" });
});

// Update a log by id (partial update supported via spread)
app.put("/logs/:id", (req, res) => {
  const { id } = req.params;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No update data provided" });
  }

  const allowedFields = ["date", "exercise", "weight", "reps", "sets"];

  if ("weight" in req.body && (typeof req.body.weight !== "number" || req.body.weight <= 0)) {
    return res.status(400).json({ error: "Invalid weight value" });
  }

  if ("reps" in req.body && (typeof req.body.reps !== "number" || req.body.reps <= 0)) {
    return res.status(400).json({ error: "Invalid reps value" });
  }

  if ("sets" in req.body && (typeof req.body.sets !== "number" || req.body.sets <= 0)) {
    return res.status(400).json({ error: "Invalid sets value" });
  }

  if ("date" in req.body){
    const d = new Date(req.body.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (isNaN(d.getTime()) || d > today) {
      return res.status(400).json({ error: "Invalid date value" });
    }
  }

    for (const key of Object.keys(req.body)) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({ error: `Invalid field: ${key}` });
      }
    }

  let updatedLog = null;

  workoutLogs = workoutLogs.map(log => {
    if (log.id === id) {
      updatedLog = { ...log, ...req.body };
      return updatedLog;
    }
    return log;
  });

  if (!updatedLog) {
    return res.status(404).json({ error: "Log not found" });
  }

  res.json(updatedLog);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});