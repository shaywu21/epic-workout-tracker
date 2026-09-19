import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

// Call this in any server component/action that needs the app's User row.
// Creates it on first login, since Clerk only stores auth, not app data.
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    const clerk = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        name: clerk?.firstName ?? undefined,
        email: clerk?.emailAddresses[0]?.emailAddress ?? undefined,
      },
    });
  }

  return user;
}
