import { db } from "@/server/db";
import Link from "next/link";

export default async function USAPage() {
  const allState = await db.query.states.findMany({});

  return (
    <div>
      {allState.map((state) => (
        <div key={state.id}>
          <Link href={`/usa/states/${state.name}`}> {state.name}</Link>
        </div>
      ))}
    </div>
  );
}
