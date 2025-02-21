"use client";
import LineChart from "@/components/dataUI/LineChart";

import type { CountyPageData } from "@/utils/types";
import type { DataSet } from "@/utils/db/types";
import { useEffect, useState } from "react";

export default function ACSSE({ allData }: { allData: CountyPageData }) {
  const [selectedYear, setSelectedYear] = useState(2023);
  const acsseData = allData.data.acsse;
  if (!acsseData) return <p> NO DATA </p>;
  const availableYears = [
    2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012,
  ];
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-start space-y-4">
      <h1 className="mb-4 text-xl font-semibold">
        Data from Census Beureu ACS Supplemental Data for {allData.county.name},{" "}
        {allData.state.name} (ACSSE)
      </h1>
      <div className="flex-1">
        <label className="mb-2 block font-medium text-gray-700">
          Select Year:
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <LineChart dataSet={acsseData.demographics!.population!} />
      <div className="flex w-full flex-row">
        <div className="flex w-1/3 flex-col">
          <DemographicSection
            dataSet={acsseData.demographics!.population!}
            title="Population"
            index={selectedYear - 2015}
          />
          <DemographicSection
            dataSet={acsseData.age!.medianAge!}
            title="Median Age"
            index={selectedYear - 2015}
          />
          <DemographicSection
            dataSet={acsseData.ethnicity!.hispanic!}
            title="Hispanic or Latino"
            index={selectedYear - 2015}
          />
          <DemographicSection
            dataSet={acsseData.mobility!.yearlyMobility!}
            title="Moved in the Past Year"
            index={selectedYear - 2015}
          />
        </div>
        <div className="flex w-1/3 flex-col">
          <DemographicSection
            dataSet={acsseData.age!.totalAge!}
            title="Age by Age Bracket"
            index={selectedYear - 2015}
          />
          <DemographicSection
            dataSet={acsseData.nationality!.citizenship!}
            title="US Citizenship Status"
            index={selectedYear - 2015}
          />
        </div>
        <div className="flex w-1/3 flex-col">
          <DemographicSection
            dataSet={acsseData.ethnicity!.race!}
            title="Race"
            index={selectedYear - 2015}
          />
          <DemographicSection
            dataSet={acsseData.birth!.birthPlace!}
            title="Birthplace"
            index={selectedYear - 2015}
          />
        </div>
      </div>
    </div>
  );
}

function DemographicSection({
  dataSet,
  title,
  index = 0,
}: {
  dataSet: DataSet[];
  title?: string;
  index?: number;
}) {
  const [stateData, setDataset] = useState<{
    name: string;
    data: { label: string; value: string | number }[];
  }>({ name: "OHNO", data: [{ label: "ERROR", value: "OHNO" }] });
  useEffect(() => {
    if (!dataSet?.[index]) {
      throw new Error("No Data");
    }
    const data = Object.entries(dataSet[index].data).map(([key, value]) => {
      const stringValue = typeof value === "number" ? value.toString() : value;
      return { label: convertKey(key), value: stringValue };
    });
    setDataset({
      name: dataSet[index].name,
      data,
    });
  }, [dataSet, index]);

  if (!stateData) {
    return <p> NO DATA </p>;
  }

  return (
    <div className="m-2 rounded-md border bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">
        {title ?? ""} ({stateData.name})
      </h3>
      <div className="space-y-3">
        {stateData.data.map((row, index) => (
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
