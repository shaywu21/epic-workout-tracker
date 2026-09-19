import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
      <SignIn />
    </main>
  );
}
