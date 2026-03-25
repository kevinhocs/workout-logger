import { deleteLog, deleteWorkout } from "../utils/api";

export default function useWorkoutActions({ editingLog, cancelEdit, fetchLogs }) {
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

    return {
    handleDelete,
    handleDeleteWorkout
  };
}