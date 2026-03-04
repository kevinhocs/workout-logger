import "./App.css";
import { useState, useEffect } from "react";

// WorkoutLog component
// Controlled form that logs workouts to a simple /logs API.
export default function WorkoutLog() {
  // --- Unit state (display unit for weight inputs / labels) ---
  const [unit, setUnit] = useState("lbs");

  // --- Form state (controlled inputs) ---
  const [form, setForm] = useState({
    date: "",
    exercise: "",
    weight: "",
    reps: "",
    sets: "",
    notes: "",
    bodyweight: "",
  });

  // --- Other UI state ---
  const [logs, setLogs] = useState([]); // fetched workout entries
  const [errors, setErrors] = useState({}); // validation messages
  const [editingLog, setEditingLog] = useState(null); // currently edited log

  // --- Networking / effects ---
  const fetchLogs = async () => {
    const res = await fetch("/api/logs");
    const data = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // --- Validation helper ---
  function validateForm(form) {
    const errors = {};

    // Date must exist and not be in the future
    if (!form.date.trim()) {
      errors.date = "Date is required!";
    } else {
      const selected = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selected.getTime())) {
        errors.date = "Invalid date";
      } else if (selected > today) {
        errors.date = "Date cannot be in the future.";
      }
    }

    // Required fields
    if (form.exercise.trim() === "") errors.exercise = "Exercise selection is required!";
    if (form.weight === "") errors.weight = "Weight value is required!";
    if (form.bodyweight === "") errors.bodyweight = "Bodyweight value is required!";

    // Reps validation
    if (form.reps === "") {
      errors.reps = "Reps value is required!";
    } else if (!/^\d+$/.test(form.reps)) {
      errors.reps = "Reps must be a whole number.";
    } else if (Number(form.reps) <= 0) {
      errors.reps = "Reps must be at least 1.";
    }

    // Sets validation (single, ordered chain)
    if (form.sets === "") {
      errors.sets = "Sets value is required!";
    } else if (!/^\d+$/.test(form.sets)) {
      errors.sets = "Sets must be a whole number.";
    } else if (Number(form.sets) <= 0) {
      errors.sets = "Sets must be at least 1.";
    }

    // Numeric checks
    if (form.weight !== "" && !/^\d+(\.\d+)?$/.test(form.weight)) {
      errors.weight = "Weight must be a positive number (decimals allowed)";
    }
    if (form.reps !== "" && !/^\d+$/.test(form.reps)) {
      errors.reps = "Reps must be a positive whole number.";
    }
    if (form.sets !== "" && !/^\d+$/.test(form.sets)) {
      errors.sets = "Sets must be a positive whole number.";
    }
    if (form.bodyweight !== "") {
      if (!/^\d+(\.\d+)?$/.test(form.bodyweight)) {
        errors.bodyweight = "Bodyweight must be a positive number (decimals allowed)";
      } else if (Number(form.bodyweight) <= 0) {
        errors.bodyweight = "Bodyweight must be greater than 0.";
      }
    }

    return errors;
  }

  // --- Input change handler (controlled inputs) ---
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  function pluralize(count, singular, plural = singular + "s") {
    return count === 1 ? singular : plural;
  }

  // --- Unit conversion helpers ---
  const KG_TO_LB = 2.20462;
  function toLbs(n) {
    const num = Number(n);
    return Number.isFinite(num) ? num * KG_TO_LB : NaN;
  }
  function round1(n) {
    return Math.round(n * 10) / 10;
  }
  function toKg(weightLbs) {
    const n = Number(weightLbs);
    if (!Number.isFinite(n)) return NaN;
    return n / KG_TO_LB;
  }

  // Toggle displayed unit and convert the current input weight if present
  const toggleWeightUnit = () => {
    const nextUnit = unit === "lbs" ? "kg" : "lbs";

    setForm((prev) => {
      const convert = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return value;

        return nextUnit === "kg"
          ? String(round1(num / KG_TO_LB))
          : String(round1(num * KG_TO_LB));
      };

      return {
        ...prev,
        weight: convert(prev.weight),
        bodyweight: convert(prev.bodyweight),
      };
    });

    setUnit(nextUnit);
  };

  // --- Submit handler (create or update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const inputWeight = Number(form.weight);
    const weightInLbs = unit === "kg" ? round1(toLbs(inputWeight)) : inputWeight;

    const updatePayload = {
      exercise: form.exercise,
      reps: Number(form.reps),
      sets: Number(form.sets),
      weight: weightInLbs,
      bodyweight: Number(form.bodyweight),
    };

    const createPayload = {
      date: form.date,
      bodyweight: Number(form.bodyweight),
      ...updatePayload,
    };

    try {
      let res;

      if (editingLog) {
        // UPDATE
        res = await fetch(`/api/logs/${editingLog.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
      } else {
        // CREATE
        res = await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });
      }

      if (!res.ok) {
        throw new Error(`Submit failed with status ${res.status}`);
      }

      await fetchLogs();
      setEditingLog(null);
      setForm({ date: "", exercise: "", weight: "", reps: "", sets: "", notes: "", bodyweight: "" });
    } catch (err) {
      console.error("Error submitting log:", err);
      alert("Failed to save workout. Server may be unavailable.");
    }
  };

  // --- Delete handler ---
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete log");
      }

      if (editingLog && editingLog.id === id) {
        cancelEdit();
      }

      await fetchLogs();
    } catch (err) {
      console.error("Error deleting log:", err);
      alert(err.message);
    }
  };

  // --- Edit handlers ---
  const startEdit = (log, session) => {
    const displayWeight = unit === "kg" ? round1(toKg(log.weight)) : log.weight;
    setEditingLog(log);
    setErrors({});
    setForm({
      date: session.date,
      exercise: log.exercise,
      weight: String(displayWeight),
      reps: log.reps,
      sets: log.sets,
      bodyweight: session.bodyweight_lbs != null
        ? (unit === "kg"
            ? String(round1(toKg(session.bodyweight_lbs)))
            : String(session.bodyweight_lbs))
        : "",
      notes: log.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingLog(null);
    setErrors({});
    setForm({ date: "", exercise: "", weight: "", reps: "", sets: "", bodyweight: "", notes: "" });
  };

  // --- Render UI ---
  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Workout Logger</h1>
        <p className="subtle">
          Each exercise records the top working set and the total number of working sets performed.
        </p>
        <button
          type="button"
          className="unit-toggle"
          onClick={toggleWeightUnit}
        >
          {unit.toUpperCase()}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-stack">
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={handleChange}
              disabled={!!editingLog}
            />
            {errors.date && <span className="error" role="alert">{errors.date}</span>}
          </div>

          <div className="field">
            <label>Exercise</label>
            <input name="exercise" value={form.exercise} placeholder="e.g., Bench Press" onChange={handleChange} />
            {errors.exercise && <span className="error" role="alert">{errors.exercise}</span>}
          </div>

          <div className="field">
            <label>Top Set Weight ({unit})</label>
            <input type="number" name="weight" value={form.weight} onChange={handleChange} min="0" step="any" />
            {errors.weight && <span className="error" role="alert">{errors.weight}</span>}
          </div>

          <div className="field">
            <label>Top Set Reps</label>
            <input name="reps" value={form.reps} onChange={handleChange} />
            {errors.reps && <span className="error" role="alert">{errors.reps}</span>}
          </div>

          <div className="field">
            <label>Total Working Sets</label>
            <input name="sets" value={form.sets} onChange={handleChange} />
            {errors.sets && <span className="error" role="alert">{errors.sets}</span>}
          </div>

          <div className="field">
            <label>Bodyweight ({unit})</label>
            <input type="number" name="bodyweight" value={form.bodyweight} onChange={handleChange} min="0" step="any" />
            {errors.bodyweight && <span className="error" role="alert">{errors.bodyweight}</span>}
          </div>

          <div className="field">
            <label>Notes</label>
            <input name="notes" value={form.notes} onChange={handleChange} />
          </div>
        </div>

        <div className="panel-footer">
          {editingLog && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
          <button type="submit" className="primary">
            {editingLog ? "Update Workout" : "Log Workout"}
          </button>
        </div>
      </form>

      <h2>Workout Sessions</h2>

      <div className="log-list">
        {logs.map((session) => (
          <div key={session.id} className="session">
            <h3>{session.date}</h3>

            {session.bodyweight_lbs != null && (
              <div className="session-bodyweight">
                Bodyweight: {unit === "kg"
                  ? `${round1(toKg(session.bodyweight_lbs))} kg`
                  : `${session.bodyweight_lbs} lbs`}
              </div>
            )}

            {session.exercises.map((log) => (
              <div key={log.id} className="log-row">
                <div className="log-meta">
                  <div className="log-exercise">{log.exercise}</div>
                  <div className="log-details">
                    <div className="top-set">
                      Top Set: {unit === "kg"
                        ? `${round1(toKg(log.weight))} kg`
                        : `${log.weight} lbs`} × {log.reps}
                    </div>

                    <div className="working-sets">
                      Working Sets: {log.sets} {pluralize(Number(log.sets), "set")}
                    </div>
                  </div>
                </div>

                <div className="log-actions">
                  <button onClick={() => startEdit(log, session)}>Edit</button>
                  <button onClick={() => handleDelete(log.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
