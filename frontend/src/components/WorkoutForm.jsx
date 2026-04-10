import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

export default function WorkoutForm({
  formState,
  unit,
  fetchLogs,
  currentWorkout,
  targetWorkoutId,
  templateExercises,
}) {
  const { form, errors, setErrors, editingLog, cancelEdit, updateField } =
    formState;

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleChange = (e) => {
    updateField(e.target.name, e.target.value);
  };

  return (
    <>
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
      {!editingLog && !targetWorkoutId && (
        <button
          type="button"
          className="primary"
          disabled={
            loading ||
            !!currentWorkout ||
            !!editingLog ||
            !!targetWorkoutId ||
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

              console.log("TEMPLATE EXERCISES:", templateExercises);

              if (templateExercises?.length) {
                for (const ex of templateExercises) {
                  await fetch("/api/logs", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      workout_id: data.id,
                      exercise: ex.name,
                      notes: ex.notes || null,
                      sets: ex.sets.map((s) => ({
                        weight: s.weight,
                        reps: s.reps,
                      })),
                    }),
                  });
                }
              }

              if (!res.ok) {
                console.error("Backend error:", data);
                throw new Error(data.error || "Failed to create workout");
              }

              await fetchLogs();

              setMessage("Workout started");
              setTimeout(() => setMessage(""), 2000);
              setLoading(false);
            } catch (err) {
              console.error("CREATE WORKOUT ERROR:", err);
              setMessage(err.message);
              setTimeout(() => setMessage(""), 2000);
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
          End Workout
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
        {!currentWorkout && !editingLog && !targetWorkoutId && (
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
