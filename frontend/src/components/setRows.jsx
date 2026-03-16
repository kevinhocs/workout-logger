export default function SetRow({ set, index, unit, updateSet, removeSet }) {
  return (
    <div className="set-row">
      <span>Set {index + 1}</span>

      <input
        type="number"
        placeholder={`Weight (${unit})`}
        value={set.weight}
        onChange={(e) => updateSet(index, "weight", e.target.value)}
      />

      <input
        type="number"
        placeholder="Reps"
        value={set.reps}
        onChange={(e) => updateSet(index, "reps", e.target.value)}
      />

      <button type="button" onClick={() => removeSet(index)}>
        ✕
      </button>
    </div>
  );
}