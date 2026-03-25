import "./App.css";
import { useState } from "react";
import { toKg, round1 } from "./utils/units";
import SessionList from "./components/SessionList";
import WorkoutForm from "./components/WorkoutForm";
import useWorkoutForm from "./hooks/useWorkoutForm";
import useWorkoutLogs from "./hooks/useWorkoutLogs";
import useWorkoutActions from "./hooks/useWorkoutActions";

export default function WorkoutLog() {
  const [unit, setUnit] = useState("lbs");
  const { form, 
    setForm, 
    sets, 
    setSets, 
    editingLog, 
    setEditingLog, 
    resetForm, 
    startEdit, 
    errors, 
    setErrors 
  } = useWorkoutForm({ unit, toKg, round1 });
  const { logs, fetchLogs } = useWorkoutLogs();
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const toggleWeightUnit = () => {
    setUnit((prev) => (prev === "lbs" ? "kg" : "lbs"));
  };

  const cancelEdit = () => {
    setErrors({});
    resetForm();
  };

  const { handleDelete, handleDeleteWorkout } = useWorkoutActions({ editingLog, cancelEdit, fetchLogs });

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