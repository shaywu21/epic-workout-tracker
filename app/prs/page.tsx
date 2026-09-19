 import Link from "next/link";
 import { getOrCreateUser } from "@/lib/current-user";
 import { getPRsByExercise } from "@/lib/workout-history";

 export default async function PRsPage() {
   const user = await getOrCreateUser();
   const prs = await getPRsByExercise(user.id);

   return (
     <main>
       <h1>Personal Records</h1>

       {prs.length === 0 && <p>No PRs yet — log some sets to get started.</p>}

       {prs.map((pr) => (
        <Link key={pr.exerciseId} href={`/prs/${pr.exerciseId}`} className="pr-row" style={{ textDecoration: "none" }}>
           <div className="pr-exercise-name">{pr.exerciseName}</div>
           <div className="pr-value">
             {pr.maxWeight}kg × {pr.reps}
           </div>
           <div className="pr-date">
             {pr.achievedAt.toLocaleDateString(undefined, {
               month: "short",
               day: "numeric",
               year: "numeric",
             })}
           </div>
        </Link>
       ))}

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