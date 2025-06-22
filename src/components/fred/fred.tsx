import {
  fetchSeries,
  getStateFredId,
  getCountyFredId,
} from "@/utils/fred/utils";
import { FREDData } from "./fredData";
import Image from "next/image";

export default async function FRED({
  state,
  geoId,
}: {
  state: string;
  geoId: string;
}) {
  const stateFredId = await getStateFredId(state);
  const countyFredId = await getCountyFredId(geoId);

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
    stateFredId ? fetchSeries(stateFredId) : Promise.resolve([]),
    countyFredId ? fetchSeries(countyFredId) : Promise.resolve([]),
  ]);

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
            <p className="mb-2 font-bold text-gray-700">County Data</p>
            <FREDData observations={[]} code={countyCodes} place={geoId} />
          </div>
        )}
      </div>
    </div>
  );
}
