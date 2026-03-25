import "./App.css";
import { useState } from "react";
import { toKg, toLbs, round1 } from "./utils/units";
import { deleteLog, deleteWorkout } from "./utils/api";
import SessionList from "./components/SessionList";
import WorkoutForm from "./components/WorkoutForm";
import useWorkoutForm from "./hooks/useWorkoutForm";
import useWorkoutLogs from "./hooks/useWorkoutLogs";

export default function WorkoutLog() {
  const [unit, setUnit] = useState("lbs");
  const { form, setForm, sets, setSets, editingLog, setEditingLog, resetForm, startEdit } = useWorkoutForm({ unit, toKg, round1 });
  const { logs, fetchLogs } = useWorkoutLogs();
  const [errors, setErrors] = useState({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedSessions, setExpandedSessions] = useState(new Set());

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

  const cancelEdit = () => {
    setErrors({});
    resetForm();
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