import { useState } from "react";

export default function useWorkoutForm({unit, toKg, round1}) {
  const [form, setForm] = useState({
    date: "",
    exercise: "",
    weight: "",
    reps: "",
    sets: "",
    notes: "",
    bodyweight: "",
  });

  const [sets, setSets] = useState([{ weight: "", reps: "" }]);
  const [editingLog, setEditingLog] = useState(null);
    const [errors, setErrors] = useState({});
  const resetForm = () => {
    setForm({
      date: "",
      exercise: "",
      weight: "",
      reps: "",
      sets: "",
      notes: "",
      bodyweight: "",
    });
    setSets([{ weight: "", reps: "" }]);
    setEditingLog(null);
  }

  const cancelEdit = () => {
    setErrors({});
    resetForm();
  };

    const startEdit = (exercise, session) => {
      const firstSetId = Array.isArray(exercise.sets) && exercise.sets.length > 0
        ? exercise.sets[0].id
        : null;
  
      setEditingLog({ id: firstSetId, name: exercise.name });
  
      setForm({
        date: session.date,
        exercise: exercise.name,
        bodyweight: session.bodyweight_lbs ?? "",
        notes: "",
      });
  
      setSets(
        exercise.sets.map((s) => ({
          weight: String(
            unit === "kg"
              ? round1(toKg(s.weight))
              : s.weight,
          ),
          reps: String(s.reps),
        })),
      );
    };

  return {
    form,
    setForm,
    sets,
    setSets,
    editingLog,
    setEditingLog,
    resetForm,
    startEdit,
    errors,
    setErrors,
    cancelEdit,
  };
}