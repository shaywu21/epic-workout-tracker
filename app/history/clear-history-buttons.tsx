"use client";

export function ClearDayButton({
  dayId,
  dayName,
  action,
}: {
  dayId: string;
  dayName: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete all logged history for "${dayName}"? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="dayId" value={dayId} />
      <button type="submit" className="btn-delete-text">
        Clear history for "{dayName}"
      </button>
    </form>
  );
}

export function ClearAllButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete ALL logged workout history, across every day? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn-delete-text" style={{ fontWeight: 700 }}>
        Clear all history
      </button>
    </form>
  );
}

export function ClearDateButton({
  dateLabel,
  action,
}: {
  dateLabel: string;
  action: () => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete all logged history from ${dateLabel}? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="btn-delete-text">
        Clear history for {dateLabel}
      </button>
    </form>
  );
}
