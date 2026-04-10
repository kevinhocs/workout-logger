import { deleteLog, deleteWorkout } from "../utils/api";

export default function useWorkoutActions({
  editingLog,
  cancelEdit,
  fetchLogs,
}) {
  const handleDelete = async (id) => {
    try {
      if (editingLog && editingLog.set_id === id) {
        cancelEdit();
      }

      await deleteLog(id);
      await fetchLogs();
    } catch (err) {
      console.error("Error deleting log:", err);
      alert(err.message);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    try {
      await deleteWorkout(workoutId);
      await fetchLogs();
    } catch (err) {
      console.error("Error deleting workout:", err);
      throw err;
    }
  };

  return {
    handleDelete,
    handleDeleteWorkout,
  };
}
