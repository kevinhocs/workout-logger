import { useRef, useEffect } from "react";

export default function ExerciseForm({
  workoutId,
  targetWorkoutId,
  setTargetWorkoutId,
  unit,
  fetchLogs,
  form,
  sets,
  setSets,
  updateSet,
  updateField,
  editingLog,
  setEditingLog,
  addSet,
  removeSet,
  templateExercises,
}) {
  const lastWeightRef = useRef(null);
  const prevLengthRef = useRef(sets.length);

  useEffect(() => {
    console.log("TEMPLATE IN FORM:", templateExercises);

    if (!templateExercises || templateExercises.length === 0) return;

    const current = templateExercises[0];

    updateField("exercise", current.name);

    setSets(
      current.sets.map((s) => ({
        weight: String(s.weight),
        reps: String(s.reps),
        notes: "",
      })),
    );
  }, [templateExercises]);

  useEffect(() => {
    if (sets.length > prevLengthRef.current) {
      lastWeightRef.current?.focus();
    }
    prevLengthRef.current = sets.length;
  }, [sets.length]);

  const handleSubmit = async () => {
    if (!form.exercise) {
      alert("Exercise required");
      return;
    }

    try {
      let res;

      if (editingLog) {
        res = await fetch(`/api/exercises/${editingLog.set_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exercise: form.exercise,
            bodyweight: editingLog.bodyweight_lbs,
            notes: sets[0]?.notes || null,
            sets: sets.map((s) => ({
              weight: Number(s.weight),
              reps: Number(s.reps),
            })),
          }),
        });
      } else {
        res = await fetch("/api/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workout_id: workoutId,
            exercise: form.exercise,
            bodyweight:
              unit === "kg"
                ? Number(form.bodyweight) * 2.20462
                : Number(form.bodyweight),
            notes: sets[0]?.notes || null,
            sets: sets.map((s) => ({
              weight: Number(s.weight),
              reps: Number(s.reps),
            })),
          }),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);
        throw new Error(text);
      }

      await fetchLogs();
      updateField("exercise", "");
      sets.forEach((_, i) => {
        updateSet(i, "weight", "");
        updateSet(i, "reps", "");
      });
      updateSet(0, "notes", "");

      if (editingLog) {
        setEditingLog(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit");
    }
  };

  return (
    <div className="exercise-form">
      <div className="exercise-header">
        <h2>{editingLog ? "Edit Exercise" : "Add Exercise"}</h2>
      </div>

      <div className="form-stack">
        <input
          placeholder="Exercise name"
          value={form.exercise || ""}
          onChange={(e) => updateField("exercise", e.target.value)}
        />

        <input
          placeholder="Notes (optional)"
          value={sets[0]?.notes || ""}
          onChange={(e) => updateSet(0, "notes", e.target.value)}
        />
      </div>
      {sets.map((set, i) => (
        <div key={i} className="set-row">
          <span>{i + 1}</span>

          <input
            ref={i === sets.length - 1 ? lastWeightRef : null}
            placeholder={`Weight (${unit})`}
            value={set.weight || ""}
            onChange={(e) => updateSet(i, "weight", e.target.value)}
          />

          <input
            placeholder="Reps"
            value={set.reps || ""}
            onChange={(e) => updateSet(i, "reps", e.target.value)}
          />

          <button onClick={() => removeSet(i)}>×</button>
        </div>
      ))}

      <div className="panel-footer">
        <button className="secondary" onClick={addSet}>
          + Add Set
        </button>

        <button className="primary" onClick={handleSubmit}>
          {editingLog ? "Save Changes" : "Add Exercise"}
        </button>

        {targetWorkoutId && !editingLog && (
          <button
            type="button"
            className="secondary"
            onClick={() => setTargetWorkoutId(null)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
