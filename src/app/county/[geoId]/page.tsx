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
import NCES from "@/components/nces/NCES";
import HUDDataFetcher from "@/components/hud/HUDDataFetcher";
import type { CountyPageData } from "@/utils/types";
import type { PublicNCESData, PrivateNCESData } from "@/utils/nces/types";
import DetailedCrimeView from "@/components/crime/detailedCrimeView";
import FRED from "@/components/fred/fred";
import { Suspense } from "react";
import MajorHealthcareProviders from "@/components/healthcare/MajorHealthcareProviders";

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

  return out.acsse!;
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
    acsse: convertToObject(
      countyData.filter((data) => data.source === "acsse"),
    ),
    publicNCES: countyData
      .filter((data) => data.source === "NCES_PUBLIC")
      .map((row) => row.dataSet),
    privateNCES: countyData
      .filter((data) => data.source === "NCES_PRIVATE")
      .map((row) => row.dataSet),
  };

  return (
    <div className="flex w-screen flex-col items-center space-y-8 bg-gray-50 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-800">
          {county}, {state}
        </h1>
      </header>

      <Suspense fallback={<p>Loading...</p>}>
        {" "}
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
              {allData.acsse?.demographics?.population
                ?.at(-1)
                ?.data.total?.toLocaleString() ?? "NO DATA"}
            </p>
            <p className="text-gray-600">
              Median Age:{" "}
              {allData.acsse.age?.medianAge
                ?.at(-1)
                ?.data.combined?.toLocaleString() ?? "NO DATA"}
            </p>
            <p className="text-gray-600">
              Median Income:{" "}
              {(() => {
                const data = fetch(
                  `https://api.census.gov/data/2023/acs/acsse?get=K201902_001E&for=county:${countyFips}&in=state:${stateFips}`,
                )
                  .then((res) => res.json())
                  .then((data: unknown) => {
                    if (
                      !Array.isArray(data) ||
                      !Array.isArray(data[1]) ||
                      !data[1][0]
                    ) {
                      return "NO DATA";
                    }
                    const rawValue = data[1][0] as string;
                    if (rawValue === "NO DATA") return rawValue;
                    return Number(rawValue).toLocaleString();
                  })
                  .catch(() => "NO DATA");
                return data;
              })()}
            </p>
            <p className="text-gray-600">
              Population Growth Rate:{" "}
              {(() => {
                const populationData = allData.acsse.demographics?.population;

                if (!populationData || populationData.length < 2) {
                  return "NO DATA";
                }

                const lastValue = populationData.at(-1)?.data?.total;
                const prevValue = populationData.at(-2)?.data?.total;

                if (
                  typeof lastValue !== "number" ||
                  typeof prevValue !== "number" ||
                  prevValue === 0
                ) {
                  return "NO DATA";
                }
                const growthRate = lastValue / prevValue - 1;
                return growthRate.toLocaleString(undefined, {
                  style: "percent",
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                });
              })()}
            </p>
            <p className="text-gray-600">
              Unemployment Rate:{" "}
              {(() => {
                const data = fetch(
                  `https://api.census.gov/data/2023/acs/acsse?get=K202301_003E,K202301_005E&for=county:${countyFips}&in=state:${stateFips}`,
                )
                  .then((res) => res.json())
                  .then((data: unknown) => {
                    if (
                      !Array.isArray(data) ||
                      !Array.isArray(data[1]) ||
                      !data[1][0] ||
                      !data[1][1]
                    ) {
                      return "NO DATA";
                    }

                    const civilianLaborForce = Number(data[1][0]);
                    const unemployed = Number(data[1][1]);

                    if (civilianLaborForce === 0) return "NO DATA";

                    const unemploymentRate =
                      (unemployed / civilianLaborForce) * 100;
                    return unemploymentRate.toFixed(1) + "%";
                  })
                  .catch(() => "NO DATA");

                return data;
              })()}
            </p>
          </div>
        </section>
      </Suspense>

      {/* <Suspense fallback={<p>Loading...</p>}>
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
      </Suspense>

      <Suspense fallback={<p>Loading...</p>}>
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
      </Suspense>

      <Suspense fallback={<p>Loading...</p>}>
        <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <CensusDataFetcher
            state={state}
            county={county}
            stateFips={stateFips}
            countyFips={countyFips}
          />
        </section>
      </Suspense>

      <Suspense fallback={<p>Loading...</p>}>
        {" "}
        <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <BLSDataFetcher
            _state={state}
            _county={county}
            stateFips={stateFips}
            countyFips={countyFips}
          />
        </section>
      </Suspense>

      <Suspense fallback={<p>Loading...</p>}>
        <section className="w-full max-w-6xl rounded-lg bg-white p-0 shadow-md md:p-0">
          <DetailedCrimeView stateFips={stateFips} stateName={state} />
        </section>
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
        <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <FRED state={state} geoId={geoId} />
        </section>
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
        <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <PopulationEstimates
            state={state}
            county={county}
            stateFips={stateFips}
            countyFips={countyFips}
          />
        </section>
      </Suspense>

      <Suspense fallback={<p>Loading...</p>}>
        {" "}
        <section className="h-full w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <ACSSE allData={allData} />
        </section>
      </Suspense>

      <Suspense fallback={<p>Loading...</p>}>
        <section className="h-full w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <NCES
            feature={countyBorder}
            token={env.MAPBOX_TOKEN}
            state={state}
            county={county}
            stateFips={stateFips}
            countyFips={countyFips}
            publicData={
              Object.values(allData.publicNCES) as unknown as PublicNCESData[]
            }
            privateData={
              Object.values(allData.privateNCES) as unknown as PrivateNCESData[]
            }
          />
        </section>
      </Suspense>

      <Suspense fallback={<p>Loading...</p>}>
        <section className="h-full w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <HUDDataFetcher
            state={state}
            county={county}
            stateFips={stateFips}
            countyFips={countyFips}
          />
        </section>
      </Suspense> */}
      <Suspense fallback={<p>Loading...</p>}>
        <section className="w-full max-w-6xl rounded-lg bg-white p-4 shadow-md">
          <MajorHealthcareProviders state={stateFips} county={countyFips} />
        </section>
      </Suspense>
    </div>
  );
}
