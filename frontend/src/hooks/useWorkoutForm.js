import { useState } from "react";

export default function useWorkoutForm() {
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

  return {
    form,
    setForm,
    sets,
    setSets,
    editingLog,
    setEditingLog,
  };
}