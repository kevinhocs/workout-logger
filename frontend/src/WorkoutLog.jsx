import "./App.css";
import { useState, useEffect } from "react";
import { toKg, toLbs, round1 } from "./utils/units";
import SetRow from "./components/SetRow";   

export default function WorkoutLog() {
  const [unit, setUnit] = useState("lbs");

  const [form, setForm] = useState({
    date: "",
    exercise: "",
    weight: "",
    reps: "",
    sets: "",
    notes: "",
    bodyweight: "",
  });

  const [sets, setSets] = useState([{ weight: "", reps: "" }]);

  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState({});
  const [editingLog, setEditingLog] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const fetchLogs = async () => {
    const res = await fetch("/api/logs");
    const data = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  function validateForm(form) {
    const errors = {};

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

    if (form.exercise.trim() === "") errors.exercise = "Exercise selection is required!";
    if (!sets.length || sets.some(s => s.weight === "")) {
      errors.weight = "Each set must have a weight.";
    }
    if (form.bodyweight === "") errors.bodyweight = "Bodyweight value is required!";

    if (!sets.length || sets.some((s) => s.reps === "")) {
      errors.reps = "Each set must have reps.";
    }

    if (!sets.length) {
      errors.sets = "At least one set is required.";
    }

    for (const s of sets) {
      if (!/^\d+(\.\d+)?$/.test(s.weight)) {
        errors.weight = "Set weights must be positive numbers.";
      }
      if (!/^\d+$/.test(s.reps)) {
        errors.reps = "Set reps must be whole numbers.";
      }
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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  function addSet() {
    setSets([...sets, { weight: "", reps: "" }]);
  }

  function removeSet(index) {
    const updated = [...sets];
    updated.splice(index, 1);
    setSets(updated);
  }

  function updateSet(index, field, value) {
    const updated = [...sets];
    updated[index][field] = value;
    setSets(updated);
  }

  function pluralize(count, singular, plural = singular + "s") {
    return count === 1 ? singular : plural;
  }

  const toggleWeightUnit = () => {
    const nextUnit = unit === "lbs" ? "kg" : "lbs";

    setForm((prev) => {
      const convert = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return value;

        return nextUnit === "kg"
          ? String(round1(toKg(num)))
          : String(round1(toLbs(num)));
      };

      return {
        ...prev,
        weight: convert(prev.weight),
        bodyweight: convert(prev.bodyweight),
      };
    });

    setUnit(nextUnit);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const setsPayload = sets.map((s) => {
      const weightInput = Number(s.weight);

      const weightInLbs =
        unit === "kg"
          ? round1(toLbs(weightInput))
          : weightInput;

      return {
        weight: weightInLbs,
        reps: Number(s.reps),
      };
    });

    const updatePayload = {
      exercise: form.exercise,
      sets: setsPayload,
      bodyweight: Number(form.bodyweight),
    };

    const createPayload = {
      date: form.date,
      ...updatePayload,
    };

    try {
      let res;

      if (editingLog?.id) {
        res = await fetch(`/api/exercises/${editingLog.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
      } else {
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
      setSets([{ weight: "", reps: "" }]);
    } catch (err) {
      console.error("Error submitting log:", err);
      alert("Failed to save workout. Server may be unavailable.");
    }
  };

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

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm("Delete this entire workout?")) return;

    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete workout");
      }

      await fetchLogs();
    } catch (err) {
      console.error("Error deleting workout:", err);
      alert("Failed to delete workout.");
    }
  };

  const startEdit = (exercise, session) => {
    const firstSetId = Array.isArray(exercise.sets) && exercise.sets.length > 0
      ? exercise.sets[0].id
      : null;

    setEditingLog({ id: firstSetId, name: exercise.name });
    setErrors({});

    setForm({
      date: session.date,
      exercise: exercise.name,
      bodyweight: session.bodyweight_lbs ?? "",
      notes: "",
    });

    setSets(
      exercise.sets.map((s) => ({
        weight: String(
          unit === "kg"
            ? round1(toKg(s.weight))
            : s.weight,
        ),
        reps: String(s.reps),
      })),
    );
  };

  const cancelEdit = () => {
    setEditingLog(null);
    setErrors({});
    setForm({ date: "", exercise: "", weight: "", reps: "", sets: "", bodyweight: "", notes: "" });
    setSets([{ weight: "", reps: "" }]);
  };

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Workout Logger</h1>
        <p className="subtle">
          Record each working set performed.
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
            <label>Sets</label>

            {sets.map((set, index) => (
              <SetRow
                key={index}
                set={set}
                index={index}
                unit={unit}
                updateSet={updateSet}
                removeSet={removeSet}
              />
            ))}

            <button type="button" className="secondary" onClick={addSet}>
              + Add Set
            </button>
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

      <div className="session-section">
        <h2>Workout Sessions</h2>
      </div>

      <div className="log-list">
        {logs.slice(0, visibleCount).map((session) => (
          <div key={session.id} className="session">
            <div
              className="session-header"
              onClick={() =>
                setExpandedSessions((prev) => {
                  const next = new Set(prev);
                  if (next.has(session.id)) next.delete(session.id);
                  else next.add(session.id);
                  return next;
                })
              }
            >
              <span className="session-arrow">
                {expandedSessions.has(session.id) ? "▼" : "▶"}
              </span>

              <span className="session-date">{session.date}</span>

              {session.bodyweight_lbs != null && (
                <span className="session-bw">
                  • Bodyweight: {unit === "kg"
                    ? `${round1(toKg(session.bodyweight_lbs))} kg`
                    : `${session.bodyweight_lbs} lbs`}
                </span>
              )}

              <button
                className="delete-session"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteWorkout(session.id);
                }}
              >
                🗑
              </button>
            </div>

            {expandedSessions.has(session.id) &&
              (session.exercises || []).map((exercise) => (
                <div key={`${session.id}-${exercise.name}`} className="log-row">
                  <div className="log-meta">
                    <div className="log-exercise-row">
                      <div className="log-exercise">{exercise.name}</div>

                      <div className="exercise-actions">
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(exercise, session)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(exercise.sets[0].id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="log-details">
                      <div className="set-header">
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span></span>
                      </div>

                      {exercise.sets.map((set) => (
                        <div key={set.id} className="set-line">
                          <span>{set.set_number}</span>

                          <span>
                            {unit === "kg"
                              ? `${round1(toKg(set.weight))} kg`
                              : `${set.weight} lbs`}
                          </span>

                          <span>{set.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {visibleCount < logs.length && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            className="secondary"
            onClick={() => setVisibleCount((v) => v + 10)}
          >
            Load Older Workouts
          </button>
        </div>
      )}
    </div>
  );
}
