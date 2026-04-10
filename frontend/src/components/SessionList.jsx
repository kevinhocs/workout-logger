import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

export default function SessionList(props) {
  const {
    logs,
    visibleCount,
    setVisibleCount,
    expandedSessions,
    setExpandedSessions,
    unit,
    handleDelete,
    handleDeleteWorkout,
    startEdit,
    round1,
    toKg,
    canEditPastWorkouts,
    setTargetWorkout,
    targetWorkout,
    cancelEdit,
    preloadWorkout,
  } = props;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [localTargetWorkout, setLocalTargetWorkout] = useState(null);

  return (
    <>
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

              <div className="session-title">
                <span className="session-date">{session.date}</span>

                {session.name && (
                  <span className="session-name"> {session.name}</span>
                )}
              </div>

              {session.bodyweight_lbs != null && (
                <span className="session-bw">
                  • Bodyweight:{" "}
                  {unit === "kg"
                    ? `${round1(toKg(session.bodyweight_lbs))} kg`
                    : `${session.bodyweight_lbs} lbs`}
                </span>
              )}

              <button
                className="delete-session"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalTargetWorkout(session);
                  setShowDeleteModal(true);
                }}
              >
                🗑
              </button>
            </div>

            {canEditPastWorkouts && expandedSessions.has(session.id) && (
              <button
                className="add-exercise-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetWorkout(session);
                }}
              >
                + Add Exercise
              </button>
            )}

            {expandedSessions.has(session.id) &&
              session.exercises &&
              session.exercises.length > 0 && (
                <button
                  className="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    preloadWorkout(session);
                  }}
                >
                  Use as Template
                </button>
              )}

            {expandedSessions.has(session.id) &&
              (session.exercises || []).map((exercise) => (
                <div key={`${session.id}-${exercise.name}`} className="log-row">
                  <div className="log-meta">
                    <div className="log-exercise-row">
                      <div className="log-exercise">{exercise.name}</div>

                      {exercise.notes && (
                        <div className="exercise-notes">{exercise.notes}</div>
                      )}

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
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Workout"
        message="This will permanently delete the workout."
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);

          if (!localTargetWorkout) {
            console.error("No workout selected");
            return;
          }

          try {
            await handleDeleteWorkout(localTargetWorkout);
            cancelEdit();
            setLocalTargetWorkout(null);
          } catch (err) {
            console.error(err);
            alert("Failed to delete workout.");
          }
        }}
      />
    </>
  );
}
