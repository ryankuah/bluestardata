import { fetchSeries, getSeries } from "@/utils/fred/utils";
import { FREDData } from "./fredData";
import Image from "next/image";

export default async function FRED({
  state,
  county,
  stateId,
  countyId,
}: {
  state: string;
  county: string;
  stateId: number | null;
  countyId: number | null;
}) {
  console.log(`FRED Component Debug - State: ${state}, County: ${county}`);
  console.log(`State FRED ID: ${stateId}, County FRED ID: ${countyId}`);

  const stateFredId = stateId;
  const countyFredId = countyId;

  console.log(`State FRED ID available: ${!!stateFredId}`);
  console.log(`County FRED ID available: ${!!countyFredId}`);

  if (!stateFredId && !countyFredId) {
    return (
      <div className="flex flex-col items-center p-8">
        <div className="mb-6 flex items-center">
          <h1 className="mr-4 text-2xl font-bold text-gray-800">FRED Data</h1>
          <Image src="/fred.png" alt="FRED" width={32} height={32} />
        </div>
        <div className="text-center text-gray-500">
          No FRED data available for this location. Please run the data
          initialization script first.
        </div>
      </div>
    );
  }

  const [allStateSeries, allCountySeries] = await Promise.all([
    stateFredId ? getSeries(stateFredId) : Promise.resolve([]),
    countyFredId ? getSeries(countyFredId) : Promise.resolve([]),
  ]);

  console.log(`State series fetched: ${allStateSeries.length}`);
  console.log(`County series fetched: ${allCountySeries.length}`);

  const stateCodes: [string, string][] = allStateSeries.map((series) => [
    series.id,
    series.title,
  ]);
  const countyCodes: [string, string][] = allCountySeries.map((series) => [
    series.id,
    series.title,
  ]);

  console.log(`State codes prepared: ${stateCodes.length}`);
  console.log(`County codes prepared: ${countyCodes.length}`);

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center">
        <h1 className="mr-4 text-2xl font-bold text-gray-800">FRED Data</h1>
        <Image src="/fred.png" alt="FRED" width={32} height={32} />
      </div>
      <div className="flex flex-row gap-4">
        {stateFredId && (
          <div className="w-1/2">
            <p className="mb-2 font-bold text-gray-700">State Data - {state}</p>
            <FREDData observations={[]} code={stateCodes} place={state} />
          </div>
        )}
        {countyFredId && (
          <div className={stateFredId ? "w-1/2" : "w-full"}>
            <p className="mb-2 font-bold text-gray-700">
              County Data - {county}
            </p>
            <FREDData observations={[]} code={countyCodes} place={county} />
          </div>
        )}
      </div>

      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-500">
        Debug: State ID: {stateFredId ?? "None"}, County ID:{" "}
        {countyFredId ?? "None"}| Rendering: {stateFredId ? "State" : ""}
        {stateFredId && countyFredId ? " + " : ""}
        {countyFredId ? "County" : ""}
      </div>
    </div>
  );
}
