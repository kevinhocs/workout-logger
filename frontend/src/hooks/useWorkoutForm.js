import { useState } from "react";

export default function useWorkoutForm({unit, toKg, round1}) {
  const [form, setForm] = useState({
    date: "",
    exercise: "",
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
          notes: s.notes ?? "",
        })),
      );
    };

      function addSet() {
    setSets((prev) => [...prev, { weight: "", reps: "" }]);
  }

    function removeSet(index) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

    function updateSet(index, field, value) {
    setSets((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
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
    editingLog,
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