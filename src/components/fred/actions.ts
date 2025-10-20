"use server";

import { fetchObservation, getObservation } from "@/utils/fred/utils";
import type { Observations } from "@/utils/fred/types";

export async function fetchObservationAction(
  code: string,
  name: string,
): Promise<Observations> {
  return await getObservation(code, name);
}
