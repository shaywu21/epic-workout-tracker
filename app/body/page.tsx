import Link from "next/link";
import { getOrCreateUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { logWeight, updateHeight } from "@/lib/body-log";

export default async function BodyPage() {
  const user = await getOrCreateUser();

  const weightLogs = await prisma.weightLog.findMany({
    where: { userId: user.id },
    orderBy: { loggedAt: "desc" },
    take: 30,
  });

  async function logWeightAction(formData: FormData) {
    "use server";
    const raw = parseFloat(formData.get("weight") as string);
    if (!Number.isFinite(raw) || raw <= 0) return;
    await logWeight(user.id, raw);
  }

  async function updateHeightAction(formData: FormData) {
    "use server";
    const raw = parseFloat(formData.get("height") as string);
    if (!Number.isFinite(raw) || raw <= 0) return;
    await updateHeight(user.id, raw);
  }

  return (
    <main>
      <h1>Body Stats</h1>

      <h2 style={{ marginTop: 24 }}>Today's weight</h2>
      <form action={logWeightAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          name="weight"
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          required
          className="text-input"
        />
        <button className="btn-primary" type="submit">
          Log Weight
        </button>
      </form>

      <div className="weight-log-list" style={{ marginTop: 16 }}>
        {weightLogs.length === 0 && <p>No weight entries yet.</p>}
        {weightLogs.map((w) => (
          <div key={w.id} className="weight-log-row">
            <span>{w.weight}kg</span>
            <span className="weight-log-date">
              {w.loggedAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              {w.loggedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Height</h2>
      <p style={{ marginTop: -8 }}>
        {user.heightCm ? `Current: ${user.heightCm}cm` : "Not set yet."}
      </p>
      <form action={updateHeightAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          name="height"
          type="number"
          step="0.1"
          placeholder="Height (cm)"
          defaultValue={user.heightCm ?? undefined}
          required
          className="text-input"
        />
        <button className="btn-secondary" type="submit">
          Update Height
        </button>
      </form>

      <Link
        href="/"
        className="btn-secondary"
        style={{ display: "block", textAlign: "center", marginTop: 24, textDecoration: "none" }}
      >
        Back home
      </Link>
    </main>
  );
}