"use client";
import LineChart from "@/components/dataUI/LineChart";

import type { CountyData } from "@/utils/db/types";

export default function Population({
  countyData,
  county,
  state,
}: {
  countyData: CountyData[];
  county: string;
  state: string;
}) {
  //Total Population
  const demographicData = countyData.filter(
    (data) => data.category === "Demographics",
  );
  const populationData = demographicData.find(
    (data) => data.name === "Population",
  );
  if (!populationData) throw new Error("Population data missing");

  //Age
  const ageData = countyData.filter((data) => data.category === "Age");
  if (!ageData) throw new Error("Age data missing");
  const medianAgeData = ageData.find((data) => data.name === "Median Age");
  const totalAgeData = ageData.find(
    (data) => data.name === "Age by Age Bracket",
  );
  if (!medianAgeData) throw new Error("Median Age missing");
  if (!totalAgeData) throw new Error("Total Age Missing");

  //Ethnicity
  const ethnicData = countyData.filter((data) => data.category === "Ethnicity");
  if (!ethnicData) throw new Error("Ethnicity data missing");
  const raceData = ethnicData.find((data) => data.name === "Race");
  const hispanicData = ethnicData.find(
    (data) => data.name === "Hispanic or Latino",
  );
  if (!raceData) throw new Error("Race data missing");
  if (!hispanicData) throw new Error("Hispanic data missing");

  //Nationality
  const nationalityData = countyData.filter(
    (data) => data.category === "Nationality",
  );
  if (!nationalityData) throw new Error("Nationality data missing");
  const citizenshipData = nationalityData.find(
    (data) => data.name === "US Citizenship Status",
  );
  if (!citizenshipData) throw new Error("Citizenship data missing");

  //Birth
  const birthData = countyData.filter((data) => data.category === "Birth");
  if (!birthData) throw new Error("Birth data missing");
  const birthPlaceData = birthData.find((data) => data.name === "Birth Place");
  if (!birthPlaceData) throw new Error("Birth Place data missing");

  //Mobility
  const mobilityDatas = countyData.filter(
    (data) => data.category === "Mobility",
  );
  if (!mobilityDatas) throw new Error("Mobility data missing");
  const mobilityData = mobilityDatas.find(
    (data) => data.name === "Yearly Mobility",
  );
  if (!mobilityData) throw new Error("Mobility data missing");

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-start space-y-4">
      <h1 className="mb-4 text-xl font-semibold">
        Data from Census Beureu ACS Supplemental Data for {county}, {state}{" "}
        (ACSSE)
      </h1>
      <LineChart dataSet={populationData.dataSet} />
      <div className="flex w-full flex-row">
        <div className="flex w-1/3 flex-col">
          <DemographicSection countyData={populationData} />
          <DemographicSection countyData={medianAgeData} />
          <DemographicSection countyData={hispanicData} />
        </div>
        <div className="flex w-1/3 flex-col">
          <DemographicSection countyData={totalAgeData} />
          <DemographicSection countyData={citizenshipData} />
        </div>
        <div className="flex w-1/3 flex-col">
          <DemographicSection countyData={raceData} />
          <DemographicSection countyData={birthPlaceData} />
          <DemographicSection countyData={mobilityData} />
        </div>
      </div>
    </div>
  );
}

function DemographicSection({ countyData }: { countyData: CountyData }) {
  const dataSet = countyData.dataSet[0]?.data;
  if (!dataSet) throw new Error("No dataset");

  const data = Object.entries(dataSet).map(([key, value]) => {
    const stringValue = typeof value === "number" ? value.toString() : value;
    return { label: convertKey(key), value: stringValue };
  });

  return (
    <div className="m-2 rounded-md border bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">{countyData.name}</h3>
      <div className="space-y-3">
        {data.map((row, index) => (
          <div
            key={index}
            className="flex flex-row items-center justify-between space-x-4 border-b pb-2 last:border-b-0"
          >
            <span className="flex text-gray-600">{row.label}</span>
            <div className="flex items-center gap-4">
              <span className="text-right font-medium">{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function convertKey(key: string) {
  const firstLetterCapitalized = key.charAt(0).toUpperCase() + key.slice(1);
  const out = firstLetterCapitalized.replace(/([A-Z])/g, " $1");
  return out.replace(/_/g, " ");
}
