import { env } from "@/env";
import CensusCBP from "./CensusCBP";

const CENSUS_API_URL = "https://api.census.gov/data/2022/cbp";

export type CensusRow = {
  industryCode: string;
  industryName: string;
  establishments: number;
  employees: number;
  annualPayroll: number;
};

type CensusApiResponse = string[][];

export async function fetchCensusData(stateFips: string, countyFips: string): Promise<CensusRow[]> {
    if (!stateFips || !countyFips) {
      throw new Error("Missing required parameters: stateFips or countyFips");
    }
  
    const url = `${CENSUS_API_URL}?get=NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN&for=county:${countyFips}&in=state:${stateFips}&key=${env.CENSUS_API_KEY}`;
  
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch data from Census API");
    }
  
    const json = (await response.json()) as unknown as CensusApiResponse;
  
    return json
      .slice(1)
      .filter((row) => row.length >= 5 && row[2] !== "0" && row[3] !== "0" && row[4] !== "0")
      .filter((row, index, self) => self.findIndex((r) => r[1] === row[1]) === index)
      .map((row) => ({
        industryCode: row[0] ?? "", 
        industryName: row[1] ?? "",
        establishments: Number(row[2]) ?? 0,
        employees: Number(row[3]) ?? 0,
        annualPayroll: Number(row[4]) ?? 0,
      }));
  }

export default async function CensusDataFetcher({
  state,
  county,
  stateFips,
  countyFips,
}: {
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
}) {
  try {
    const data = await fetchCensusData(stateFips, countyFips);
    return <CensusCBP data={data} state={state} county={county} />;
  } catch (error) {
    return <div className="text-red-500 text-center">Failed to load data</div>;
  }
}
