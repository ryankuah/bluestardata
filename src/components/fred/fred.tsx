import { db } from "@/server/db";
import { fetchObservations, fetchSeries, type FredData } from "@/utils";
import { FREDData } from "./fredData";
import Image from "next/image";

export default async function FRED({
  state,
  county,
}: {
  state: string;
  county: string;
}) {
  const stateObj = await db.query.states.findFirst({
    where: (states, { eq }) => eq(states.name, state),
    columns: {
      fredId: true,
    },
    with: {
      fredData: true,
    },
  });
  const countyObj = await db.query.counties.findFirst({
    where: (counties, { eq }) => eq(counties.name, county),
    columns: {
      fredId: true,
    },
    with: {
      fredData: true,
    },
  });

  if (!stateObj || !countyObj) {
    return <div>No data found</div>;
  }

  const stateFredCodes = stateObj.fredData as unknown as FredData[];
  const countyFredCodes = countyObj.fredData as unknown as FredData[];

  const stateData = await fetchObservations(stateFredCodes);
  const countyData = await fetchObservations(countyFredCodes);

  const fredStateCodes = stateFredCodes.map((series) => [
    series.seriesCode,
    series.name,
  ]);
  const fredCountyCodes = countyFredCodes.map((series) => [
    series.seriesCode,
    series.name,
  ]);

  const allStateSeries = await fetchSeries(stateObj.fredId!);
  const allCountySeries = await fetchSeries(countyObj.fredId!);

  const allStateCodes: [string, string][] = allStateSeries.map((series) => [
    series.id,
    series.title,
  ]);
  const allCountyCodes: [string, string][] = allCountySeries.map((series) => [
    series.id,
    series.title,
  ]);

  const stateCodes: [string, string][] = allStateCodes
    .filter((series) => !fredStateCodes.includes(series))
    .filter((item) => item !== null && item !== undefined);
  const countyCodes: [string, string][] = allCountyCodes
    .filter((series) => !fredCountyCodes.includes(series))
    .filter((item) => item !== null && item !== undefined);

  return (
    <div className="flex h-full w-full flex-col">
      <Image src="/fred.png" alt="FRED" width={32} height={32} />
      <div className="flex h-full w-full flex-row">
        <div className="flex w-1/2 flex-col">
          <p>State Data</p>
          <FREDData observations={stateData} code={stateCodes} place={state} />
        </div>
        <div className="flex w-1/2 flex-col">
          <p>County Data</p>
          <FREDData
            observations={countyData}
            code={countyCodes}
            place={county}
          />
        </div>
      </div>
    </div>
  );
}
