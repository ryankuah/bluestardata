import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { states } from "@/server/db/schema";

export default async function statePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const slug = (await params).state;
  const state = decodeURIComponent(slug);
  const stateDB = await db.query.states.findFirst({
    where: eq(states.name, state),
    with: {
      counties: true,
      msas: true,
    },
  });
  if (!stateDB) return <div>{state} not found</div>;
  const counties = stateDB.counties;
  const msas = stateDB.msas;

  return (
    <div className="flex flex-row">
      <div className="flex flex-col">
        {counties.map((county) => (
          <div key={county.id}>
            <a href={`/usa/states/${state}/county/${county.name}`}>
              {county.name}
            </a>
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        {msas.map((msa) => (
          <div key={msa.id}>
            <a href={`/usa/states/${state}/MSA/${msa.name}`}>{msa.name}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
