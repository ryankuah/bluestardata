import { db } from "@/server/db";
import { counties, states } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
export async function getCountyGeoId(county: string, state: string) {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  const stateFips = await getStatebyName(state);

  const result = await db
    .select({
      geoId: counties.geoId,
    })
    .from(counties)
    .where(eq(counties.stateId, stateFips))
    .orderBy(sql`similarity(${counties.name}, ${county}) DESC`)
    .limit(1);

  if (!result[0]) throw new Error("No county found");
  return result[0].geoId;
}

export async function getStatebyName(name: string) {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  const result = await db
    .select({
      fipsCode: states.fipsCode,
    })
    .from(states)
    .orderBy(sql`similarity(${states.name}, ${name}) DESC`)
    .limit(1);

  if (!result[0]) throw new Error("No state found");

  return result[0].fipsCode;
}

