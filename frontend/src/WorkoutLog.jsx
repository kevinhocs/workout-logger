import "./App.css";
import { useState } from "react";
import { toKg, round1 } from "./utils/units";
import SessionList from "./components/SessionList";
import WorkoutForm from "./components/WorkoutForm";
import useWorkoutForm from "./hooks/useWorkoutForm";
import useWorkoutLogs from "./hooks/useWorkoutLogs";
import useWorkoutActions from "./hooks/useWorkoutActions";
import ExerciseForm from "./components/ExerciseForm";

export default function WorkoutLog() {
  const [unit, setUnit] = useState("lbs");
  const formState = useWorkoutForm({ unit, toKg, round1 });
  const { logs, fetchLogs } = useWorkoutLogs();
  const activeWorkout = logs.find((w) => Number(w.completed) === 0);
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [targetWorkoutId, setTargetWorkoutId] = useState(null);
  const [templateExercises, setTemplateExercises] = useState([]);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [isTemplateMode, setIsTemplateMode] = useState(false);

  const preloadWorkout = (session) => {
    console.log("PRELOAD SESSION:", session);
    console.log("FORM AFTER PRELOAD:", formState.form);

    if (!session.exercises?.length) {
      alert("No exercises found.");
      return;
    }

    const first = session.exercises[0];

    formState.updateField("name", session.name || "");

    formState.updateField("date", new Date().toISOString().split("T")[0]);

    formState.updateField("exercise", first.name);

    formState.setSets(
      first.sets.map((s) => ({
        weight: unit === "kg" ? round1(toKg(s.weight)) : String(s.weight),
        reps: String(s.reps),
        notes: "",
      })),
    );

    setTemplateExercises(session.exercises);
    setTemplateIndex(0);

    setTargetWorkoutId(null);
  };

  const toggleWeightUnit = () => {
    setUnit((prev) => (prev === "lbs" ? "kg" : "lbs"));
  };

  const { handleDelete, handleDeleteWorkout } = useWorkoutActions({
    editingLog: formState.editingLog,
    cancelEdit: formState.cancelEdit,
    fetchLogs,
  });

  return (
    <div className="panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Workout Logger</h1>
        <p className="subtle">Record each working set performed.</p>
        <button
          type="button"
          className="unit-toggle"
          onClick={toggleWeightUnit}
        >
          {unit.toUpperCase()}
        </button>
      </div>

      <WorkoutForm
        formState={formState}
        unit={unit}
        fetchLogs={fetchLogs}
        currentWorkout={activeWorkout}
        targetWorkoutId={targetWorkoutId}
      />

      {(activeWorkout || formState.editingLog || targetWorkoutId) && (
        <ExerciseForm
          workoutId={
            activeWorkout?.id ||
            formState.editingLog?.workout_id ||
            targetWorkoutId
          }
          targetWorkoutId={targetWorkoutId}
          setTargetWorkoutId={setTargetWorkoutId}
          unit={unit}
          fetchLogs={fetchLogs}
          form={formState.form}
          sets={formState.sets}
          setSets={formState.setSets}
          updateSet={formState.updateSet}
          updateField={formState.updateField}
          editingLog={formState.editingLog}
          setEditingLog={formState.setEditingLog}
          addSet={formState.addSet}
          removeSet={formState.removeSet}
          templateExercises={templateExercises}
        />
      )}

      <div className="session-section">
        {activeWorkout ? (
          <>
            <h2>Active Session</h2>
            <SessionList
              logs={[activeWorkout]}
              visibleCount={1}
              setVisibleCount={() => {}}
              expandedSessions={expandedSessions}
              setExpandedSessions={setExpandedSessions}
              unit={unit}
              handleDelete={handleDelete}
              handleDeleteWorkout={handleDeleteWorkout}
              startEdit={formState.startEdit}
              round1={round1}
              toKg={toKg}
              canEditPastWorkouts={true}
              setTargetWorkoutId={setTargetWorkoutId}
              preloadWorkout={preloadWorkout}
            />
          </>
        ) : formState.editingLog || targetWorkoutId ? (
          <>
            <h2>Editing Workout</h2>
            <SessionList
              logs={logs.filter(
                (w) =>
                  w.id ===
                  (formState.editingLog?.workout_id || targetWorkoutId),
              )}
              visibleCount={1}
              setVisibleCount={() => {}}
              expandedSessions={expandedSessions}
              setExpandedSessions={setExpandedSessions}
              unit={unit}
              handleDelete={handleDelete}
              handleDeleteWorkout={handleDeleteWorkout}
              startEdit={formState.startEdit}
              round1={round1}
              toKg={toKg}
              canEditPastWorkouts={true}
              setTargetWorkoutId={setTargetWorkoutId}
              targetWorkoutId={targetWorkoutId}
              cancelEdit={formState.cancelEdit}
              preloadWorkout={preloadWorkout}
            />
          </>
        ) : (
          <>
            <h2>Workout History</h2>
            <SessionList
              logs={logs}
              visibleCount={visibleCount}
              setVisibleCount={setVisibleCount}
              expandedSessions={expandedSessions}
              setExpandedSessions={setExpandedSessions}
              unit={unit}
              handleDelete={handleDelete}
              handleDeleteWorkout={handleDeleteWorkout}
              startEdit={formState.startEdit}
              round1={round1}
              toKg={toKg}
              canEditPastWorkouts={true}
              setTargetWorkoutId={setTargetWorkoutId}
              preloadWorkout={preloadWorkout}
            />
          </>
        )}
      </div>
    </div>
  );
}
