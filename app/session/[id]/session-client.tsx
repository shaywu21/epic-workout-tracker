"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logSet, deleteSet, completeSession } from "./actions";

type Exercise = { id: string; name: string; targetSets: number; targetReps: string };
type SetLog = { id: string; exerciseId: string; setNumber: number; weight: number; reps: number };

// Fixed fallback defaults used when an exercise has never been logged before (SOW 7.5).
const DEFAULT_FALLBACK_WEIGHT = 20;
const DEFAULT_FALLBACK_REPS = 10;

export default function SessionClient({
  sessionId,
  dayName,
  exercises,
  existingSetLogs,
  lastByExercise,
  isCompleted,
}: {
  sessionId: string;
  dayName: string;
  exercises: Exercise[];
  existingSetLogs: SetLog[];
  lastByExercise: Record<string, { weight: number; reps: number } | null>;
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [setLogs, setSetLogs] = useState(existingSetLogs);
  const [logError, setLogError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);

  if (isCompleted) {
    return (
      <main>
        <h1>{dayName} — Done</h1>
        <p>This session is already completed.</p>
        <button className="btn-primary" onClick={() => router.push("/")}>
          Back home
        </button>
      </main>
    );
  }

  if (exercises.length === 0) {
    return (
      <main>
        <h1>{dayName}</h1>
        <p>This day has no exercises yet.</p>
        <button className="btn-primary" onClick={() => router.push("/")}>
          Back home
        </button>
      </main>
    );
  }

  const exercise = exercises[index];
  const last = lastByExercise[exercise.id];
  const [weight, setWeight] = useState(last?.weight ?? DEFAULT_FALLBACK_WEIGHT);
  const [reps, setReps] = useState(last?.reps ?? DEFAULT_FALLBACK_REPS);

  const loggedForThisExercise = setLogs.filter((s) => s.exerciseId === exercise.id);

  async function handleLogSet() {
    setLogError(null);
    try {
      await logSet(sessionId, exercise.id, weight, reps);
      setSetLogs((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, exerciseId: exercise.id, setNumber: loggedForThisExercise.length + 1, weight, reps },
      ]);
    } catch {
      setLogError("Couldn't save — check your connection and try again.");
    }
  }

  async function handleDeleteSet(id: string) {
    try {
      if (!id.startsWith("temp-")) await deleteSet(id, sessionId);
      setSetLogs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setLogError("Couldn't save — check your connection and try again.");
    }
  }

  async function handleNext() {
    setNextError(null);
    if (index + 1 < exercises.length) {
      setIndex(index + 1);
    } else {
      try {
        await completeSession(sessionId);
        router.push("/");
      } catch {
        setNextError("Couldn't save — check your connection and try again.");
      }
    }
  }

  return (
    <main>
      <p className="progress">
        {dayName} — Exercise {index + 1} of {exercises.length}
      </p>
      <h1>{exercise.name}</h1>
      <p>
        Target: {exercise.targetSets} sets × {exercise.targetReps} reps
      </p>
      {last && (
        <p>
          Last time: {last.weight}kg × {last.reps}
        </p>
      )}

      <div className="stepper">
        <button onClick={() => setWeight((w) => Math.max(0, w - 2.5))} disabled={weight <= 0}>
          −
        </button>
        <span className="value">{weight}kg</span>
        <button onClick={() => setWeight((w) => w + 2.5)}>+</button>
      </div>

      <div className="stepper">
        <button onClick={() => setReps((r) => Math.max(0, r - 1))} disabled={reps <= 0}>
          −
        </button>
        <span className="value">{reps} reps</span>
        <button onClick={() => setReps((r) => r + 1)}>+</button>
      </div>

      <button className="btn-primary" onClick={handleLogSet}>
        Log Set
      </button>
      {logError && <p className="error-text">{logError}</p>}

      {loggedForThisExercise.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {loggedForThisExercise.map((s) => (
            <div key={s.id} className="set-row">
              <span>
                Set {s.setNumber}: {s.weight}kg × {s.reps}
              </span>
              <button onClick={() => handleDeleteSet(s.id)} className="btn-delete" style={{ fontSize: 15 }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn-secondary" onClick={handleNext}>
        {index + 1 < exercises.length ? "Next Exercise →" : "Finish Session"}
      </button>
      {nextError && <p className="error-text">{nextError}</p>}
    </main>
  );
}
