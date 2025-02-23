import { db } from "@/server/db";
import { counties } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import CountyMap from "./map";
import { type Feature } from "geojson";
import Unemployment from "./unemployment";
import Labour from "./employment";
import BLSDataFetcher from "@/components/bls/BLSDataFetcher";
import CensusDataFetcher from "@/components/census/CensusDataFetcher";
import ACSSE from "@/components/census/ACSSE";
import type { CountyData, DataSet } from "@/utils/db/types";
import PopulationEstimates from "@/components/population_estimates/population_estimates";

import type { CountyPageData } from "@/utils/types";

const convertToObject = (data: CountyData[]) => {
  const out: Record<string, Record<string, Record<string, DataSet[]>>> = {};
  data.forEach((item) => {
    if (!item) {
      return;
    }

    const source = item.source;
    const category = item.category;
    const name = item.name;

    if (!category || !name || !source) {
      return;
    }
    if (!out[source]) {
      out[source] = {};
    }
    if (!out[source][category]) {
      out[source][category] = {};
    }
    if (!out[source][category][name]) {
      out[source][category][name] = [];
    }
    out[source][category][name] = item.dataSet;
  });

  return out;
};

export default async function Page({
  params,
}: {
  params: Promise<{ geoId: string }>;
}) {
  const geoId = (await params).geoId;
  const dbObj = await db.query.counties.findFirst({
    where: eq(counties.geoId, geoId),
    with: {
      data: true,
      state: {
        with: { data: true },
      },
    },
  });

  const countyBorder = dbObj?.border as Feature;

  const state = dbObj?.state?.name;
  const stateFips = dbObj?.stateId.toString().padStart(2, "0");

  const county = dbObj?.name;
  const countyFips = dbObj?.fipsCode.toString().padStart(3, "0");

  if (!state || !stateFips || !county || !countyFips)
    throw new Error("Invalid state");

  const countyData = dbObj?.data as CountyData[];

  const allData: CountyPageData = {
    county: {
      name: county,
      fipsCode: countyFips,
      geoId: geoId,
    },
    state: {
      name: state,
      fipsCode: stateFips,
    },
    data: convertToObject(countyData),
  };
  console.log("HERE", allData);

  return (
    <div className="flex w-screen flex-col items-center space-y-8 bg-gray-50 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-800">
          {county}, {state}
        </h1>
      </header>

      <section className="flex w-full max-w-6xl flex-col gap-6 rounded-lg bg-white p-4 shadow-md lg:flex-row">
        <div className="h-80 flex-1 overflow-hidden rounded-lg">
          <CountyMap feature={countyBorder} token={env.MAPBOX_TOKEN} />
        </div>
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Basic Statistics
          </h2>
          <p className="text-gray-600">
            Population:{" "}
            {allData.data
              .acsse!.demographics?.population?.at(-1)
              ?.data.total?.toLocaleString() ?? "NO DATA"}
          </p>
          <p className="text-gray-600">Median Age: {}</p>
          <p className="text-gray-600">Median Income: TBD</p>
          <p className="text-gray-600">Population Growth Rate</p>
          <p className="text-gray-600">Unemployment Rate: TBD</p>
        </div>
      </section>

      <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
        <h2 className="text-xl font-semibold text-gray-700">
          Unemployment Data
        </h2>
        <Unemployment
          state={state}
          county={county}
          stateFips={stateFips}
          countyFips={countyFips}
        />
      </section>

      <section className="flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 rounded-lg bg-white p-4 shadow-md">
          <Labour
            state={state}
            county={county}
            stateFips={stateFips}
            countyFips={countyFips}
          />
        </div>
      </section>

      <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
        <CensusDataFetcher
          state={state}
          county={county}
          stateFips={stateFips}
          countyFips={countyFips}
        />
      </section>

      <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
        <BLSDataFetcher
          _state={state}
          _county={county}
          stateFips={stateFips}
          countyFips={countyFips}
        />
      </section>
      {
        // <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
        //   <FRED state={state} county={county} />
        // </section>
      }
      <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
        <PopulationEstimates
          state={state}
          county={county}
          stateFips={stateFips}
          countyFips={countyFips}
        />
      </section>
      <section className="h-full w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
        <ACSSE allData={allData} />
      </section>
    </div>
  );
}
