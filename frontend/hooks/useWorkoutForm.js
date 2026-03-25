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

  return {
    form,
    setForm,
  };
}