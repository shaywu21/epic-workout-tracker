import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/current-user";
import { revalidatePath } from "next/cache";

async function addDay(formData: FormData) {
  "use server";
  const trimmed = (formData.get("name") as string)?.trim();
  if (!trimmed) return;
  const name = trimmed.slice(0, 50);
  const user = await getOrCreateUser();
  const count = await prisma.day.count({ where: { userId: user.id } });
  await prisma.day.create({ data: { userId: user.id, name, order: count } });
  revalidatePath("/manage");
}

async function deleteDay(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.day.delete({ where: { id } });
  revalidatePath("/manage");
}

export default async function ManagePage() {
  const user = await getOrCreateUser();
  const days = await prisma.day.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } });

  return (
    <main>
      <h1>Manage Days</h1>

      {days.map((day) => (
        <div key={day.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Link href={`/manage/${day.id}`} className="day-card" style={{ flex: 1, textDecoration: "none" }}>
            {day.name}
          </Link>
          <form action={deleteDay}>
            <input type="hidden" name="id" value={day.id} />
            <button type="submit" className="btn-delete">
              ✕
            </button>
          </form>
        </div>
      ))}

      <form action={addDay} style={{ marginTop: 16 }}>
        <input
          name="name"
          placeholder="New day name (e.g. Push)"
          required
          maxLength={50}
          className="text-input"
        />
        <button className="btn-primary" type="submit">
          Add Day
        </button>
      </form>

      <Link href="/" className="btn-secondary" style={{ display: "block", textAlign: "center", marginTop: 16, textDecoration: "none" }}>
        Back home
      </Link>
    </main>
  );
}
