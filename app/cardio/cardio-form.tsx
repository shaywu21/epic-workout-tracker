"use client";

import { useState } from "react";

const LABELS: Record<string, string> = {
  TREADMILL: "Treadmill",
  CYCLE: "Cycle",
  ELLIPTICAL: "Elliptical",
};

export default function CardioForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [type, setType] = useState<"TREADMILL" | "CYCLE" | "ELLIPTICAL">("TREADMILL");

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <select
        name="type"
        className="text-input"
        value={type}
        onChange={(e) => setType(e.target.value as typeof type)}
      >
        {Object.entries(LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <input
        name="minutes"
        type="number"
        step="0.5"
        min="0"
        placeholder="Time (minutes)"
        required
        className="text-input"
      />

      {type === "TREADMILL" && (
        <input
          name="incline"
          type="number"
          step="0.5"
          min="0"
          placeholder="Incline (%)"
          className="text-input"
        />
      )}

      {type === "ELLIPTICAL" && (
        <input
          name="level"
          type="number"
          step="1"
          min="0"
          placeholder="Level"
          className="text-input"
        />
      )}

      <button className="btn-primary" type="submit">
        Log Cardio
      </button>
    </form>
  );
}