function validateForm(form, sets) {
  const errors = {};

  if (!form.date.trim()) {
    errors.date = "Date is required!";
  } else {
    const selected = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(selected.getTime())) {
      errors.date = "Invalid date";
    } else if (selected > today) {
      errors.date = "Date cannot be in the future.";
    }
  }

  if (form.exercise.trim() === "") errors.exercise = "Exercise selection is required!";

  if (!sets.length) {
    errors.sets = "At least one set is required.";
  } else if (sets.some((s) => s.weight === "")) {
    if (!errors.weight) errors.weight = "Each set must have a weight.";
  }

  if (form.bodyweight === "") errors.bodyweight = "Bodyweight value is required!";

  if (sets.length && sets.some((s) => s.reps === "")) {
    if (!errors.reps) errors.reps = "Each set must have reps.";
  }

  if (sets.length) {
  for (const s of sets) {
    if (!/^\d+(\.\d+)?$/.test(s.weight)) {
      if (!errors.weight) errors.weight = "Set weights must be positive numbers.";
    }
    if (!/^\d+$/.test(s.reps)) {
      if (!errors.reps) errors.reps = "Set reps must be whole numbers.";
    }
  }
    }

  if (form.bodyweight !== "") {
    if (!/^\d+(\.\d+)?$/.test(form.bodyweight)) {
      errors.bodyweight = "Bodyweight must be a positive number (decimals allowed)";
    } else if (Number(form.bodyweight) <= 0) {
      errors.bodyweight = "Bodyweight must be greater than 0.";
    }
  }

  return errors;
}