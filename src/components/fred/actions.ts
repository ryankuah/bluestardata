"use server";

import { fetchObservation } from "@/utils/fred/utils";
import type { Observations } from "@/utils/fred/types";

export async function fetchObservationAction(
  code: string,
  name: string,
): Promise<Observations> {
  return await fetchObservation(code, name);
}
