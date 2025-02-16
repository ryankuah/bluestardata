"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";

interface PopulationDashboardProps {
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
}

type PopulationData = {
  density: number;
  region: string | null;
  state: string;
  county: string;
  geoId: string;
  funcStat: string | null;
  pop: number;
  lastUpdate: string;
  division: string | null;
  primGeoFlag: string | null;
  dateCode: string;
};

type CharAgeGroupsData = {
  ageGroup: string;
  pop: number;
  sex: string;
  race: string;
  hisp: string;
  state: string;
  county: string;
  dateCode: string;
};

type responseData = {
  population: PopulationData[];
  charAgeGroups: CharAgeGroupsData[];
};

// Utility functions
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

const dateCodeToYear = (dateCode: string): string => {
  const baseYear = 2010;
  const offset = parseInt(dateCode, 10);
  return (baseYear + offset - 1).toString();
};

interface DemographicSectionProps {
  title: string;
  rows: { label: string; value: number | string }[];
}

const DemographicSection = ({ title, rows }: DemographicSectionProps) => (
  <div className="rounded-md border bg-white p-4 shadow-sm">
    <h3 className="mb-4 text-lg font-semibold">{title}</h3>
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex items-center justify-between border-b pb-2 last:border-b-0"
        >
          <span className="flex-1 text-gray-600">{row.label}</span>
          <div className="flex items-center gap-4">
            <span className="text-right font-medium">
              {typeof row.value === "number"
                ? `${row.value.toFixed(1)}%`
                : row.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function PopulationEstimates({
  state,
  county,
  stateFips,
  countyFips,
}: PopulationDashboardProps) {
  const [populationData, setPopulationData] = useState<PopulationData[]>([]);
  const [charAgeGroupsData, setCharAgeGroupsData] = useState<
    CharAgeGroupsData[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2019);

  const availableYears = [2019, 2018];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/population", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateFips,
          countyFips,
          year: selectedYear,
        }),
      });

      const json = (await response.json()) as responseData;

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      setPopulationData(json.population || []);
      setCharAgeGroupsData(json.charAgeGroups || []);
    } catch (err) {
      console.error("Error fetching population data:", err);
      setPopulationData([]);
      setCharAgeGroupsData([]);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [stateFips, countyFips, selectedYear]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const processCharAgeGroupsData = (data: CharAgeGroupsData[]) => {
    const overallTotal = populationData[0]?.pop ?? 1;
    const totalPop = overallTotal;

    const countyData = data.filter(
      (row) => row.state === stateFips && row.county === countyFips,
    );

    const totalPopulation = countyData
      .filter(
        (row) =>
          row.ageGroup === "0" && // Under 5 age group
          row.sex === "0" && // Total population (not male/female-specific)
          row.race === "0" && // Total population (not race-specific)
          row.hisp === "0" &&
          row.county === countyFips &&
          row.state === stateFips, // Total population (not Hispanic-specific)
      )
      .reduce((sum, row) => sum + row.pop, 0);

    console.log("Total Popluaiton Population (Corrected):", totalPopulation);

    // Calculate demographics
    const under5 =
      countyData.find(
        (row) =>
          row.ageGroup === "4" && // Under 5 age group
          row.sex === "0" && // Total population (not male/female-specific)
          row.race === "0" && // Total population (not race-specific)
          row.hisp === "0" && // Total population (not Hispanic-specific)
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const under18 =
      countyData.find(
        (row) =>
          row.ageGroup === "19" && // Under 18 age group
          row.sex === "0" && // Total population (not male/female-specific)
          row.race === "0" && // Total population (not race-specific)
          row.hisp === "0" && // Total population (not Hispanic-specific)
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const between25_44 =
      countyData.find(
        (row) =>
          row.ageGroup === "24" && // Under 18 age group
          row.sex === "0" && // Total population (not male/female-specific)
          row.race === "0" && // Total population (not race-specific)
          row.hisp === "0" && // Total population (not Hispanic-specific)
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const between45_64 =
      countyData.find(
        (row) =>
          row.ageGroup === "25" && // Under 18 age group
          row.sex === "0" && // Total population (not male/female-specific)
          row.race === "0" && // Total population (not race-specific)
          row.hisp === "0" && // Total population (not Hispanic-specific)
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const over65 =
      countyData.find(
        (row) =>
          row.ageGroup === "26" &&
          row.sex === "0" &&
          row.race === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const females =
      countyData.find(
        (row) =>
          row.sex === "2" &&
          row.ageGroup === "0" &&
          row.race === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const male =
      countyData.find(
        (row) =>
          row.sex === "1" &&
          row.ageGroup === "0" &&
          row.race === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    // Race calculations (raw values)
    const whiteAlone =
      countyData.find(
        (row) =>
          row.race === "1" &&
          row.sex === "0" &&
          row.ageGroup === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const blackAlone =
      countyData.find(
        (row) =>
          row.race === "2" &&
          row.sex === "0" &&
          row.ageGroup === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const tworaces =
      countyData.find(
        (row) =>
          row.race === "6" &&
          row.sex === "0" &&
          row.ageGroup === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const hispanic =
      countyData.find(
        (row) =>
          row.hisp === "2" &&
          row.sex === "0" &&
          row.ageGroup === "0" &&
          row.race === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const pacific_Hawaiian_native =
      countyData.find(
        (row) =>
          row.race === "5" &&
          row.sex === "0" &&
          row.ageGroup === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const asianAlone =
      countyData.find(
        (row) =>
          row.race === "4" &&
          row.sex === "0" &&
          row.ageGroup === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    const americanIndian =
      countyData.find(
        (row) =>
          row.race === "9" &&
          row.sex === "0" &&
          row.ageGroup === "0" &&
          row.hisp === "0" &&
          row.state === stateFips &&
          row.county === countyFips,
      )?.pop ?? 0;

    return {
      population: [
        { label: "Population estimates base", value: formatNumber(totalPop) }, // still a placeholder
      ],
      ageAndSex: [
        {
          label: "Persons under 5 years:",
          value: Number(((under5 / totalPop) * 100).toFixed(1)),
        },
        {
          label: "Persons under 18 years:",
          value: Number(((under18 / totalPop) * 100).toFixed(1)),
        },
        {
          label: "Persons between 25 and 44 years:",
          value: Number(((between25_44 / totalPop) * 100).toFixed(1)),
        },
        {
          label: "Persons between 44 and 64 years:",
          value: Number(((between45_64 / totalPop) * 100).toFixed(1)),
        },
        {
          label: "Persons 65 years and over:",
          value: Number(((over65 / totalPop) * 100).toFixed(1)),
        },
        {
          label: "Female persons:",
          value: Number(((females / totalPop) * 100).toFixed(1)),
        },
        {
          label: "Male persons:",
          value: Number(((male / totalPop) * 100).toFixed(1)),
        },
      ],
      raceAndHispanic: [
        { label: "White alone:", value: (whiteAlone / totalPop) * 100 },
        { label: "Black alone:", value: (blackAlone / totalPop) * 100 },
        {
          label: "American Indian and Alaska Native alone:",
          value: (americanIndian / totalPop) * 100,
        },
        { label: "Asian alone:", value: (asianAlone / totalPop) * 100 },
        {
          label: "Native Hawaiian and Other Pacific Islander alone:",
          value: (pacific_Hawaiian_native / totalPop) * 100,
        },
        {
          label: "Two or More Races:",
          value: (tworaces / totalPop) * 100,
        },
        {
          label: "Hispanic or Latino:",
          value: (hispanic / totalPop) * 100,
        },
      ],
    };
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-start space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Population Estimates for {county}, {state}
            <div className="text-sm font-normal text-gray-500">
              (Data available for 2018-2019)
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <label className="mb-2 block font-medium text-gray-700">
                Select Estimate Year:
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

            <button
              onClick={() => void fetchData()}
              disabled={loading}
              className={`rounded-md px-4 py-2 text-white transition-colors ${
                loading
                  ? "cursor-not-allowed bg-blue-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Loading..." : "Refresh Data"}
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {populationData.length > 0 && (
            <div className="h-100 mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={populationData.map((row) => ({
                    ...row,
                    year: dateCodeToYear(row.dateCode),
                  }))}
                  margin={{ top: 20, right: 40, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#ddd" />
                  <XAxis
                    dataKey="year"
                    label={{
                      value: "Year",
                      position: "insideBottom",
                      dy: 10,
                      style: {
                        fontSize: "14px",
                        fontWeight: "bold",
                        fill: "#666",
                      },
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Population",
                      angle: -90,
                      position: "insideLeft",
                      dx: -20,
                      style: {
                        fontSize: "12px",
                        fontWeight: "bold",
                        fill: "#666",
                      },
                    }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pop"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: "#2563eb" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Demographics Sections */}
          {charAgeGroupsData.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-8">
                <DemographicSection
                  title="Population"
                  rows={processCharAgeGroupsData(charAgeGroupsData).population}
                />
                <DemographicSection
                  title="Age and Sex"
                  rows={processCharAgeGroupsData(charAgeGroupsData).ageAndSex}
                />
              </div>
              <div>
                <DemographicSection
                  title="Race and Hispanic Origin"
                  rows={
                    processCharAgeGroupsData(charAgeGroupsData).raceAndHispanic
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
