import Link from "next/link";
import { getOrCreateUser } from "@/lib/current-user";
import { logCardio, deleteCardioLog, getCardioHistory } from "@/lib/cardio";
import { CardioType } from "@prisma/client";
import CardioForm from "./cardio-form";

const LABELS: Record<string, string> = {
  TREADMILL: "Treadmill",
  CYCLE: "Cycle",
  ELLIPTICAL: "Elliptical",
};

export default async function CardioPage() {
  const user = await getOrCreateUser();
  const logs = await getCardioHistory(user.id);

  async function logCardioAction(formData: FormData) {
    "use server";
    const type = formData.get("type") as CardioType;
    const minutes = parseFloat(formData.get("minutes") as string);
    if (!Number.isFinite(minutes) || minutes <= 0) return;

    const inclineRaw = formData.get("incline") as string;
    const levelRaw = formData.get("level") as string;
    const incline = inclineRaw ? parseFloat(inclineRaw) : undefined;
    const level = levelRaw ? parseInt(levelRaw, 10) : undefined;

    await logCardio(user.id, type, minutes, incline, level);
  }

  async function deleteCardioAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteCardioLog(id);
  }

  return (
    <main>
      <h1>Cardio</h1>
      <p style={{ opacity: 0.7 }}>Log treadmill, cycle, or elliptical sessions</p>

      <CardioForm action={logCardioAction} />

      <div style={{ marginTop: 16 }}>
        {logs.length === 0 && <p>No cardio logged yet.</p>}
        {logs.map((log) => (
          <div key={log.id} className="set-row">
            <span>
              {LABELS[log.type]} — {log.minutes} min
              {log.incline != null && ` @ ${log.incline}% incline`}
              {log.level != null && ` @ level ${log.level}`}
            </span>
            <form action={deleteCardioAction}>
              <input type="hidden" name="id" value={log.id} />
              <button type="submit" className="btn-delete" style={{ fontSize: 15 }}>
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard"
        className="btn-secondary"
        style={{ display: "block", textAlign: "center", marginTop: 16, textDecoration: "none" }}
      >
        Back home
      </Link>
    </main>
  );
}