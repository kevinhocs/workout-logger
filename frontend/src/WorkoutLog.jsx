import "./App.css";
import { useState, useEffect } from "react";
import { toKg, toLbs, round1 } from "./utils/units";
import { getLogs, deleteLog, deleteWorkout } from "./utils/api";
import SessionList from "./components/SessionList";
import WorkoutForm from "./components/WorkoutForm";
import useWorkoutForm from "./hooks/useWorkoutForm";

export default function WorkoutLog() {
  const [unit, setUnit] = useState("lbs");
  const { form, setForm } = useWorkoutForm();
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

  const toggleWeightUnit = () => {
    setUnit((prev) => (prev === "lbs" ? "kg" : "lbs"));
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

      <WorkoutForm
        form={form}
        setForm={setForm}
        sets={sets}
        setSets={setSets}
        unit={unit}
        setUnit={setUnit}
        errors={errors}
        setErrors={setErrors}
        editingLog={editingLog}
        setEditingLog={setEditingLog}
        fetchLogs={fetchLogs}
      />


      <div className="session-section">
        <h2>Workout Sessions</h2>
        <SessionList
          logs={logs}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          expandedSessions={expandedSessions}
          setExpandedSessions={setExpandedSessions}
          unit={unit}
          handleDelete={handleDelete}
          handleDeleteWorkout={handleDeleteWorkout}
          startEdit={startEdit}
          round1={round1}
          toKg={toKg}
        />
      </div>
    </div>
  );
}