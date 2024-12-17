"use server";

import { db } from "@/server/db";
import { countries, states, counties, msas } from "@/server/db/schema";
import { fetchCategories } from "@/utils";

export async function addUSA() {
  await db.insert(countries).values({
    name: "United States",
    id: 1,
  });
}

export async function fredStates() {
  const allStates = await fetchCategories(27281);
  for (const state of allStates) {
    const returnedId = await db
      .insert(states)
      .values({
        name: state.name,
        countryId: 1,
        fredId: state.id,
      })
      .returning({ insertedId: states.id })
      .onConflictDoNothing();
    const id =
      returnedId[0]?.insertedId ??
      (
        await db.query.states.findFirst({
          where: (states, { eq }) => eq(states.name, state.name),
        })
      )?.id;
    if (!id) {
      console.log("No id found for state", state.name);
      continue;
    }
    const stateOptions = await fetchCategories(state.id);
    let countiesId;
    let msasId;
    stateOptions.forEach((option) => {
      if (option.name === "Counties") {
        countiesId = option.id;
      } else if (option.name === "MSAs") {
        msasId = option.id;
      }
    });
    if (countiesId) {
      await fredState(countiesId, id);
    }
    if (msasId) {
      await fredMSA(msasId, id);
    }
  }
}

async function fredState(code: number, stateId: number) {
  const allCounties = await fetchCategories(code);
  for (const county of allCounties) {
    await db
      .insert(counties)
      .values({
        name: county.name,
        stateId: stateId,
        fredId: county.id,
      })
      .onConflictDoNothing();
  }
}
async function fredMSA(code: number, stateId: number) {
  const allMSAs = await fetchCategories(code);
  for (const msa of allMSAs) {
    await db
      .insert(msas)
      .values({
        name: msa.name,
        stateId: stateId,
        fredId: msa.id,
      })
      .onConflictDoNothing();
  }
}
