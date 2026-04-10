import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

export default function WorkoutForm({
  formState,
  unit,
  fetchLogs,
  currentWorkout,
  targetWorkout,
  templateExercises,
}) {
  const { form, errors, setErrors, editingLog, cancelEdit, updateField } =
    formState;

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleChange = (e) => {
    updateField(e.target.name, e.target.value);
  };

  return (
    <>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      {!editingLog && currentWorkout && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px",
            background: "#1e3a8a",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
          }}
        >
          Active Workout: <strong>{currentWorkout.name}</strong> (
          {currentWorkout.date})
        </div>
      )}
      {!editingLog && !currentWorkout && !targetWorkout && (
        <button
          type="button"
          className="primary"
          disabled={
            loading ||
            !!currentWorkout ||
            !!editingLog ||
            !!targetWorkout ||
            !form.date ||
            !form.name ||
            !form.bodyweight
          }
          style={{
            marginBottom: "16px",
            width: "100%",
            opacity: currentWorkout ? 0.5 : 1,
            cursor: currentWorkout ? "not-allowed" : "pointer",
          }}
          onClick={async () => {
            if (loading) return;
            setLoading(true);
            if (!form.date || !form.name || !form.bodyweight) {
              setErrors({
                date: !form.date ? "Required" : "",
                name: !form.name ? "Required" : "",
                bodyweight: !form.bodyweight ? "Required" : "",
              });
              setLoading(false);
              return;
            }

            try {
              const res = await fetch("/api/workouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  date: form.date,
                  name: form.name,
                  bodyweight:
                    unit === "kg"
                      ? Number(form.bodyweight) * 2.20462
                      : Number(form.bodyweight),
                }),
              });

              const data = await res.json();

              if (templateExercises?.length) {
                for (const ex of templateExercises) {
                  if (!ex.sets || ex.sets.length === 0) continue;

                  const cleanSets = ex.sets
                    .filter((s) => s.weight && s.reps)
                    .map((s) => ({
                      weight: Number(s.weight),
                      reps: Number(s.reps),
                    }));

                  if (cleanSets.length === 0) continue;

                  const res = await fetch("/api/logs", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      workout_id: data.workout_id,
                      exercise: ex.name,
                      bodyweight:
                        unit === "kg"
                          ? Number(form.bodyweight) * 2.20462
                          : Number(form.bodyweight),
                      notes: ex.notes || null,
                      sets: cleanSets,
                    }),
                  });

                  if (!res.ok) {
                    const errText = await res.text();
                    console.error(
                      "LOG INSERT FAILED:",
                      ex.name,
                      cleanSets,
                      errText,
                    );
                  }
                }
              }

              if (!res.ok) {
                let message = "Failed to create workout.";

                if (data?.error?.includes("UNIQUE constraint failed")) {
                  message =
                    "You already have a workout with this name on this date.";
                }

                console.error("Backend error:", data);
                throw new Error(message);
              }

              await fetchLogs();

              setError("");
              setMessage("Workout started");
              setTimeout(() => setMessage(""), 5000);
              setLoading(false);
            } catch (err) {
              console.error("CREATE WORKOUT ERROR:", err);
              setError(err.message);
              setTimeout(() => setError(""), 5000);
              setLoading(false);
            }
          }}
        >
          Start Workout
        </button>
      )}
      {!editingLog && currentWorkout && (
        <button
          type="button"
          className="secondary"
          style={{ marginBottom: "16px", width: "100%" }}
          onClick={async () => {
            if (loading) return;
            setLoading(true);
            await fetch(`/api/workouts/${currentWorkout.id}/complete`, {
              method: "PATCH",
            });
            setLoading(false);

            localStorage.removeItem("currentWorkout");

            cancelEdit();

            await fetchLogs();

            setMessage("Workout ended");
            setTimeout(() => setMessage(""), 2000);
          }}
        >
          Log Workout
        </button>
      )}

      {!editingLog && currentWorkout && (
        <button
          type="button"
          className="danger"
          style={{ marginBottom: "16px", width: "100%" }}
          disabled={loading}
          onClick={() => setShowCancelModal(true)}
        >
          Cancel Workout
        </button>
      )}

      <div>
        {!currentWorkout && !editingLog && !targetWorkout && (
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
              {errors.date && (
                <span className="error" role="alert">
                  {errors.date}
                </span>
              )}
            </div>

            <div className="field">
              <label>Workout Name</label>
              <input
                name="name"
                value={form.name}
                placeholder="e.g., Upper, Lower, Push"
                onChange={handleChange}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="field">
              <label>Bodyweight ({unit})</label>
              <input
                type="number"
                name="bodyweight"
                value={form.bodyweight}
                onChange={handleChange}
                min="0"
                step="any"
              />
              {errors.bodyweight && (
                <span className="error" role="alert">
                  {errors.bodyweight}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="panel-footer">
          {editingLog && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>
      <ConfirmModal
        open={showCancelModal}
        title="Cancel Workout"
        message="All exercises will be lost. This cannot be undone."
        onCancel={() => setShowCancelModal(false)}
        onConfirm={async () => {
          setShowCancelModal(false);
          setLoading(true);

          try {
            await fetch(`/api/workouts/${currentWorkout.id}`, {
              method: "DELETE",
            });

            localStorage.removeItem("currentWorkout");

            await fetchLogs();

            setMessage("Workout cancelled");
            setTimeout(() => setMessage(""), 2000);
          } catch (err) {
            console.error("Cancel workout error:", err);
            setMessage("Failed to cancel workout");
            setTimeout(() => setMessage(""), 2000);
          }

          setLoading(false);
        }}
      />
    </>
  );
}
