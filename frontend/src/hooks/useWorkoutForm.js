import { useState } from "react";

export default function useWorkoutForm({ unit, toKg, round1 }) {
  const [form, setForm] = useState({
    date: "",
    name: "",
    exercise: "",
    bodyweight: "",
  });

  const [sets, setSets] = useState([{ weight: "", reps: "", notes: "" }]);
  const [editingLog, setEditingLog] = useState(null);
  const [errors, setErrors] = useState({});
  const resetForm = () => {
    setForm({
      date: "",
      name: "",
      exercise: "",
      bodyweight: "",
    });
    setSets([{ weight: "", reps: "" }]);
    setEditingLog(null);
  };

  const cancelEdit = () => {
    setErrors({});
    resetForm();
  };

  const startEdit = (exercise, session) => {
    const firstSetId =
      Array.isArray(exercise.sets) && exercise.sets.length > 0
        ? exercise.sets[0].id
        : null;

    setEditingLog({
      set_id: firstSetId,
      exercise: exercise.name,
      bodyweight_lbs: session.bodyweight_lbs,
      workout_id: session.id,
    });

    setForm({
      date: session.date,
      name: session.name || "",
      exercise: exercise.name,
      bodyweight:
        unit === "kg"
          ? round1(toKg(session.bodyweight_lbs))
          : (session.bodyweight_lbs ?? ""),
    });

    setSets(
      exercise.sets.map((s) => ({
        weight: String(unit === "kg" ? round1(toKg(s.weight)) : s.weight),
        reps: String(s.reps),
      })),
    );
  };

  function addSet() {
    setSets((prev) => {
      const lastSet = prev[prev.length - 1];

      return [
        ...prev,
        {
          weight: lastSet?.weight || "",
          reps: "",
        },
      ];
    });
  }

  function removeSet(index) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSet(index, field, value) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return {
    form,
    sets,
    setSets,
    editingLog,
    setEditingLog,
    resetForm,
    startEdit,
    errors,
    setErrors,
    cancelEdit,
    addSet,
    removeSet,
    updateSet,
    updateField,
  };
}
