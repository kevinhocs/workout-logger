import "./App.css";
import { useState, useEffect } from "react";
import { toKg, toLbs, round1 } from "./utils/units";
import SetRow from "./components/setRows";   
import { validateForm } from "./utils/validation";
import { getLogs, createWorkout, updateExercise, deleteLog, deleteWorkout } from "./utils/api";

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
    const data = await getLogs();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);


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

    const validationErrors = validateForm(form, sets);
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

      if (editingLog?.id) {
        await updateExercise(editingLog.id, updatePayload);
      } else {
        await createWorkout(createPayload);
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
      await deleteLog(id);

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
await deleteWorkout(workoutId);
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
    </div>
  );
}
