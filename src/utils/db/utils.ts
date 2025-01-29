import { db } from "@/server/db";
import { countyDatas, stateDatas } from "@/server/db/schema";

export async function addCountyData<T>(
  geoId: string,
  category: string,
  name: string,
  input: T,
): Promise<void> {
  const data = JSON.stringify(input);
  if (!data) throw new Error(`Input not stringified for ${name}`);
  await db.insert(countyDatas).values({
    countyId: geoId,
    category,
    name,
    data,
  });
}

export async function addStateData<T>(
  fipsCode: number,
  category: string,
  name: string,
  input: T,
): Promise<void> {
  const data = JSON.stringify(input);
  if (!data) throw new Error(`Input not stringified for ${name}`);
  await db.insert(stateDatas).values({
    stateId: Number(fipsCode),
    category,
    name,
    data,
  });
}

export async function getCountyData(geoId: string, name: string) {
  const data = await db.query.countyDatas.findFirst({
    where: (countyDatas, { eq }) =>
      eq(countyDatas.countyId, geoId) && eq(countyDatas.name, name),
  });
  if (!data) throw new Error(`Data not found for ${name}`);
  return data.data;
}

export async function getStateData(fipsCode: string, name: string) {
  const data = await db.query.stateDatas.findFirst({
    where: (stateDatas, { eq }) =>
      eq(stateDatas.stateId, Number(fipsCode)) && eq(stateDatas.name, name),
  });
  if (!data) throw new Error(`Data not found for ${name}`);
  return data.data;
}

