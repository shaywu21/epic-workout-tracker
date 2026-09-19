"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logSet, deleteSet, completeSession } from "./actions";

type Exercise = { id: string; name: string; targetSets: number; targetReps: string };
type SetLog = { id: string; exerciseId: string; setNumber: number; weight: number; reps: number; isPR?: boolean };

// Fixed fallback defaults used when an exercise has never been logged before (SOW 7.5).
const DEFAULT_FALLBACK_WEIGHT = 20;
const DEFAULT_FALLBACK_REPS = 10;

export default function SessionClient({
  sessionId,
  dayName,
  exercises,
  existingSetLogs,
  lastByExercise,
  priorMaxByExercise,
  isCompleted,
}: {
  sessionId: string;
  dayName: string;
  exercises: Exercise[];
  existingSetLogs: SetLog[];
  lastByExercise: Record<string, { weight: number; reps: number } | null>;
  priorMaxByExercise: Record<string, number>;
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [setLogs, setSetLogs] = useState<SetLog[]>(() => {
    const runningMax = { ...priorMaxByExercise };
    return existingSetLogs.map((log) => {
      const priorForExercise = runningMax[log.exerciseId] ?? 0;
      const isPR = log.weight > priorForExercise;
      if (isPR) runningMax[log.exerciseId] = log.weight;
      return { ...log, isPR };
    });
  });
  const [logError, setLogError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);
  const [showNotesStep, setShowNotesStep] = useState(false);
  const [notes, setNotes] = useState("");

  const exercise = exercises.length > 0 ? exercises[index] : null;
  const last = exercise ? lastByExercise[exercise.id] : null;
  const currentPR = exercise ? priorMaxByExercise[exercise.id] ?? 0 : 0;
  const [weight, setWeight] = useState(last?.weight ?? DEFAULT_FALLBACK_WEIGHT);
  const [reps, setReps] = useState(last?.reps ?? DEFAULT_FALLBACK_REPS);

  if (isCompleted) {
    return (
      <main>
        <h1>{dayName} — Done</h1>
        <p>This session is already completed.</p>
        <button className="btn-primary" onClick={() => router.push("/dashboard")}>
          Back home
        </button>
      </main>
    );
  }

  if (!exercise) {
    return (
      <main>
        <h1>{dayName}</h1>
        <p>This day has no exercises yet.</p>
        <button className="btn-primary" onClick={() => router.push("/dashboard")}>
          Back home
        </button>
      </main>
    );
  }

  if (showNotesStep) {
    return (
      <main>
        <h1>{dayName} — Add Notes</h1>
        <p>Optional — how did the workout feel? Anything worth remembering?</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={6}
          className="text-input"
          placeholder="e.g. Felt strong on bench, knee was a bit sore on squats..."
          style={{ resize: "vertical" }}
        />
        <button
          className="btn-primary"
          onClick={async () => {
            setNextError(null);
            try {
              await completeSession(sessionId, notes);
              router.push("/dashboard");
            } catch {
              setNextError("Couldn't save — check your connection and try again.");
            }
          }}
        >
          Finish Session
        </button>
        {nextError && <p className="error-text">{nextError}</p>}
        <button
          className="btn-secondary"
          onClick={async () => {
            setNextError(null);
            try {
              await completeSession(sessionId, "");
              router.push("/dashboard");
            } catch {
              setNextError("Couldn't save — check your connection and try again.");
            }
          }}
        >
          Skip Notes
        </button>
      </main>
    );
  }

  const loggedForThisExercise = setLogs.filter((s) => s.exerciseId === exercise.id);

  async function handleLogSet() {
    setLogError(null);
    try {
      const { isPR } = await logSet(sessionId, exercise!.id, weight, reps);
      setSetLogs((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          exerciseId: exercise!.id,
          setNumber: loggedForThisExercise.length + 1,
          weight,
          reps,
          isPR,
        },
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

  function goToNextOrFinish() {
    if (index + 1 < exercises.length) {
      setIndex(index + 1);
    } else {
      setShowNotesStep(true);
    }
  }

  async function handleNext() {
    setNextError(null);
    goToNextOrFinish();
  }

  function handleSkip() {
    setNextError(null);
    goToNextOrFinish();
  }

  return (
    <main>
      <button onClick={() => router.push("/dashboard")} className="btn-back" aria-label="Back to home">
        ← Back
      </button>

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
      {currentPR > 0 && <p>Current PR: {currentPR}kg</p>}

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
                {s.isPR && <span className="pr-badge">🏆 PR</span>}
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
      <button className="btn-secondary" onClick={handleSkip}>
        Skip Exercise
      </button>
      {nextError && <p className="error-text">{nextError}</p>}
    </main>
  );
}