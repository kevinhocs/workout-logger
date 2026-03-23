export async function getLogs() {
  const res = await fetch("/api/logs");
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function createWorkout(payload) {
  const res = await fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create workout");
  return await res.json();;
}

export async function updateExercise(id, payload) {
  const res = await fetch(`/api/exercises/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to update exercise");
  return await res.json();
}

export async function deleteLog(id) {
  const res = await fetch(`/api/logs/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete log");
  }
}

export async function deleteWorkout(workoutId) {
  const res = await fetch(`/api/workouts/${workoutId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete workout");
  }
}