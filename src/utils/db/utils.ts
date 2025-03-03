import { db } from "@/server/db";
import { countyDatas, stateDatas } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { type DataSet } from "./types";

export async function addCountyData(
  geoId: string,
  category: string,
  name: string,
  source: string,
  dataSet: DataSet[] | string | number,
) {
  //Check if data already exists
  const row = await db.query.countyDatas
    .findFirst({
      where: (countyDatas, { eq, and }) =>
        and(
          eq(countyDatas.countyId, geoId),
          eq(countyDatas.name, name),
          eq(countyDatas.category, category),
        ),
    })
    .execute();
  const id = row?.id;
  //Update
  if (id) {
    console.log("Updating county data", id);
    await db
      .update(countyDatas)
      .set({
        dataSet: JSON.stringify(dataSet),
      })
      .where(eq(countyDatas.id, id));
  } else {
    //Insert
    console.log("Inserting county data", id);
    await db
      .insert(countyDatas)
      .values({
        countyId: geoId,
        category,
        name,
        source,
        dataSet: JSON.stringify(dataSet),
      })
      .onConflictDoNothing()
      .catch((error) => {
        console.error(error);
      });
  }
}

export async function addStateData(
  stateFips: number,
  category: string,
  name: string,
  source: string,
  dataSet: DataSet | string | number,
) {
  //Check if data already exists
  const id = (
    await db.query.stateDatas.findFirst({
      where: (stateDatas, { eq }) =>
        eq(stateDatas.stateId, stateFips) &&
        eq(stateDatas.name, name) &&
        eq(stateDatas.category, category),
    })
  )?.id;
  //Update
  if (id) {
    await db
      .update(stateDatas)
      .set({
        dataSet: JSON.stringify(dataSet),
      })
      .where(eq(stateDatas.id, id));
  } else {
    //Insert
    await db
      .insert(stateDatas)
      .values({
        stateId: stateFips,
        category,
        name,
        source,
        dataSet: JSON.stringify(dataSet),
      })
      .onConflictDoNothing()
      .catch((error) => {
        console.error(error);
      });
  }
}

export async function getCountyData(
  geoId: string,
  name: string,
  category: string,
) {
  const data = await db.query.countyDatas.findFirst({
    where: (countyDatas, { eq }) =>
      eq(countyDatas.countyId, geoId) &&
      eq(countyDatas.name, name) &&
      eq(countyDatas.category, category),
  });
  if (!data) throw new Error(`Data not found for ${name}`);
  return data.dataSet;
}

export async function getStateData(
  fipsCode: string,
  name: string,
  category: string,
) {
  const data = await db.query.stateDatas.findFirst({
    where: (stateDatas, { eq }) =>
      eq(stateDatas.stateId, Number(fipsCode)) &&
      eq(stateDatas.name, name) &&
      eq(stateDatas.category, category),
  });
  if (!data) throw new Error(`Data not found for ${name}`);
  return data.dataSet;
}
