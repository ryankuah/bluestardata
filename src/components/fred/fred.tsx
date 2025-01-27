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
    columns: { fredId: true },
    with: { fredData: true },
  });
  const countyObj = await db.query.counties.findFirst({
    where: (counties, { eq }) => eq(counties.name, county),
    columns: { fredId: true },
    with: { fredData: true },
  });

  if (!stateObj || !countyObj) {
    return <div>No data found</div>;
  }

  const stateFredCodes = stateObj.fredData as unknown as FredData[];
  const countyFredCodes = countyObj.fredData as unknown as FredData[];

  const stateData = await fetchObservations(stateFredCodes);
  const countyData = await fetchObservations(countyFredCodes);

  const allStateSeries = await fetchSeries(stateObj.fredId!);
  const allCountySeries = await fetchSeries(countyObj.fredId!);

  const stateCodes: [string, string][] = allStateSeries.map((series) => [
    series.id,
    series.title,
  ]);
  const countyCodes: [string, string][] = allCountySeries.map((series) => [
    series.id,
    series.title,
  ]);

  return (
    <div className="flex flex-col">
      <Image src="/fred.png" alt="FRED" width={32} height={32} />
      <div className="flex flex-row">
        <div className="w-1/2">
          <p className="font-bold">State Data</p>
          <FREDData
            observations={stateData}
            code={stateCodes}
            place={state}
          />
        </div>
        <div className="w-1/2">
          <p className="font-bold">County Data</p>
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
