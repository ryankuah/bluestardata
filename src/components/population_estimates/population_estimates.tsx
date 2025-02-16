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
import { AlertCircle } from "lucide-react";
import { format } from "node:path/win32";

interface PopulationDashboardProps {
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
}

type ProcessedAcsData = {
  name: string;
  totalPopulation: number;
  malePopulation: {
    under5: number;
    under18: number;
    age18to24: number;
    age25to44: number;
    age45to64: number;
    age65andOver: number;
    total: number;
  };
  femalePopulation: {
    under5: number;
    under18: number;
    age18to24: number;
    age25to44: number;
    age45to64: number;
    age65andOver: number;
    total: number;
  };
  raceAndHispanic: {
    whiteAlone: number;
    blackAlone: number;
    americanIndianAlone: number;
    asianAlone: number;
    pacificIslanderAlone: number;
    otherRaceAlone: number;
    twoOrMoreRaces: number;
    hispanicOrLatino: number;
  };
  nativityCitizenship: {
    foreignBorn: number;
    naturalizedCitizen: number;
    notCitizen: number;
  };
  education: {
    lessThanHS: number;
    hsGraduate: number;
    someCollege: number;
    associates: number;
    bachelors: number;
    mastersOrHigher: number;
  };
  veteranStatus: {
    totalVeterans: number;
    employedVeterans: number;
    veteransWithDisability: number;
    };

  incomeEmployment: {
    totalLaborForce: number;
    medianHouseholdIncome: number;
    perCapitaIncome: number;
    percentBelowPoverty: number;
    percentEmployed: number;
    percentUnemployed: number;
    laborForceParticipation: number;
    };
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
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
  const [demographicData, setDemographicData] =
    useState<ProcessedAcsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2023);

  const availableYears = [
    2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012];

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

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = (await response.json()) as ProcessedAcsData;
      setDemographicData(data);
    } catch (err) {
      console.error("Error fetching demographic data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [stateFips, countyFips, selectedYear]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const processDataForDisplay = (data: ProcessedAcsData) => {
    const total = data.totalPopulation;

    return {
      population: [
        {
          label: "Total Population",
          value: formatNumber(total),
        },
      ],
      ageAndSex: [
        {
          label: "Persons under 5 years",
          value:
            ((data.malePopulation.under5 + data.femalePopulation.under5) /
              total) *
            100,
        },
        {
          label: "Persons under 18 years",
          value:
            ((data.malePopulation.under18 + data.femalePopulation.under18) /
              total) *
            100,
        },
        {
          label: "Persons 18 to 24 years",
          value:
            ((data.malePopulation.age18to24 + data.femalePopulation.age18to24) /
              total) *
            100,
        },
        {
          label: "Persons 25 to 44 years",
          value:
            ((data.malePopulation.age25to44 + data.femalePopulation.age25to44) /
              total) *
            100,
        },
        {
          label: "Persons 45 to 64 years",
          value:
            ((data.malePopulation.age45to64 + data.femalePopulation.age45to64) /
              total) *
            100,
        },
        {
          label: "Persons 65 years and over",
          value:
            ((data.malePopulation.age65andOver +
              data.femalePopulation.age65andOver) /
              total) *
            100,
        },
        {
          label: "Female persons",
          value: (data.femalePopulation.total / total) * 100,
        },
        {
          label: "Male persons",
          value: (data.malePopulation.total / total) * 100,
        },
      ],
      raceAndHispanic: [
        {
          label: "White alone",
          value: (data.raceAndHispanic.whiteAlone / total) * 100,
        },
        {
          label: "Black alone",
          value: (data.raceAndHispanic.blackAlone / total) * 100,
        },
        {
          label: "American Indian and Alaska Native alone",
          value: (data.raceAndHispanic.americanIndianAlone / total) * 100,
        },
        {
          label: "Asian alone",
          value: (data.raceAndHispanic.asianAlone / total) * 100,
        },
        {
          label: "Native Hawaiian and Other Pacific Islander alone",
          value: (data.raceAndHispanic.pacificIslanderAlone / total) * 100,
        },
        {
          label: "Two or More Races",
          value: (data.raceAndHispanic.twoOrMoreRaces / total) * 100,
        },
        {
          label: "Hispanic or Latino",
          value: (data.raceAndHispanic.hispanicOrLatino / total) * 100,
        },
      ],
      VeteranStatus: [
        {
          label: "Total Veterans",
          value: (data.veteranStatus.totalVeterans / total) * 100,
        },
        {
          label: "Employed Veterans",
          value: (data.veteranStatus.employedVeterans / total) * 100,
        },
        {
          label: "Veterans with Disability",
          value: (data.veteranStatus.veteransWithDisability / total) * 100,
        },
      ],
      Citizenship: [
        {
          label: "Foreign Born",
          value: (data.nativityCitizenship.foreignBorn / total) * 100,
        },
        {
          label: "Naturalized Citizen",
          value: (data.nativityCitizenship.naturalizedCitizen / total) * 100,
        },
        {
          label: "Not a Citizen",
          value: (data.nativityCitizenship.notCitizen / total) * 100,
        }
      ],
      Education:[
        {
          label: "Less than High School",
          value: (data.education.lessThanHS / total) * 100,
        },
        {
          label: "High School Graduate",
          value: (data.education.hsGraduate / total) * 100,
        },
        {
          label: "Some College",
          value: (data.education.someCollege / total) * 100,
        },
        {
          label: "Associates Degree",
          value: (data.education.associates / total) * 100,
        },
        {
          label: "Bachelors Degree",
          value: (data.education.bachelors / total) * 100,
        },
        {
          label: "Masters or Higher",
          value: (data.education.mastersOrHigher / total) * 100,
        }
      ],
      income: [
              {
                label: "Median Household Income",
                value: formatCurrency(data.incomeEmployment.medianHouseholdIncome),
                format: "currency",
              },
              {
                label: "Per Capita Income",
                value: formatCurrency(data.incomeEmployment.perCapitaIncome),
                format: "currency",
              },
              {
                label: "Persons Below Poverty Line",
                value: (data.incomeEmployment.percentBelowPoverty / total ) * 100,
                format: "percent",
              },
            ],
            employment: [
              {
                label: "Employment Rate",
                value: `${data.incomeEmployment.percentEmployed.toFixed(1)}%`,  // ✅ Fixed formatting
              },
              {
                label: "Total Work Force",
                value: data.incomeEmployment.totalLaborForce > 0
                  ? formatNumber(data.incomeEmployment.totalLaborForce)
                  : "N/A",  // ✅ Handles cases where data is missing
              },
              {
                label: "Unemployment Rate",
                value: `${data.incomeEmployment.percentUnemployed.toFixed(1)}%`,  // ✅ Fixed formatting
              },
              {
                label: "Labor Force Participation",
                value: `${data.incomeEmployment.laborForceParticipation.toFixed(1)}%`,  // ✅ Fixed formatting
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
              (Data from ACS 5-Year Estimates)
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
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

          {/* ✅ Fixed conditional rendering structure */}
          {demographicData && (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-8">
                <DemographicSection
                  title="Population"
                  rows={processDataForDisplay(demographicData).population}
                />
                <DemographicSection
                  title="Age and Sex"
                  rows={processDataForDisplay(demographicData).ageAndSex}
                />
              </div>
              <div>
                <DemographicSection
                  title="Race and Hispanic Origin"
                  rows={processDataForDisplay(demographicData).raceAndHispanic}
                />
              </div>
              <div>
                <DemographicSection
                  title="Income"
                  rows={processDataForDisplay(demographicData).income}
                />
              </div>
              <div>
                <DemographicSection
                  title="Employment"
                  rows={processDataForDisplay(demographicData).employment}
                  />
              </div>
              <div>
                <DemographicSection
                  title="Veteran Status"
                  rows={processDataForDisplay(demographicData).VeteranStatus}
                />
              </div>
              <div>
                <DemographicSection
                  title="Citizenship"
                  rows={processDataForDisplay(demographicData).Citizenship}
                />
              </div>
              <div className="md:col-span-2">
                <DemographicSection
                  title="Education"
                  rows={processDataForDisplay(demographicData).Education}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
