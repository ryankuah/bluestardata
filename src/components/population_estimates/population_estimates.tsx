"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

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
    maximumFractionDigits: 0,
  }).format(num);
};

export default function PopulationEstimates({
  state,
  county,
  stateFips,
  countyFips,
}: PopulationDashboardProps) {
  const [demographicData, setDemographicData] = useState<{
    [year: number]: ProcessedAcsData | null;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([2023, 2022]);

  const availableYears = [
    2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012,
  ];

  const fetchDataForYear = useCallback(
    async (year: number) => {
      try {
        const response = await fetch("/api/population", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stateFips,
            countyFips,
            year,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${year}`);
        }

        return (await response.json()) as ProcessedAcsData;
      } catch (err) {
        console.error(`Error fetching data for ${year}:`, err);
        throw err;
      }
    },
    [stateFips, countyFips]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        selectedYears.map((year) => fetchDataForYear(year))
      );

      const newData = { ...demographicData };
      selectedYears.forEach((year, index) => {
        newData[year] = results[index] ?? null;
      });

      setDemographicData(newData);
    } catch (err) {
      console.error("Error fetching demographic data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [stateFips, countyFips, selectedYears]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const ComparisonRow = ({
    label,
    values,
    isPercentage = false,
    isCurrency = false,
  }: {
    label: string;
    values: { [year: number]: number | string };
    isPercentage?: boolean;
    isCurrency?: boolean;
  }) => {
    const allValuesPresent = selectedYears.every(
      (year) => values[year] !== undefined && values[year] !== "N/A"
    );

    return (
      <div className="grid grid-cols-12 gap-4 py-2 even:bg-gray-50">
        <div className="col-span-4 font-medium text-gray-700">{label}</div>
        {selectedYears.map((year) => (
          <div key={year} className="col-span-2 text-right">
            <div className="font-semibold">
              {typeof values[year] === "number"
                ? isCurrency
                  ? formatCurrency(values[year] as number)
                  : isPercentage
                  ? `${(values[year] as number).toFixed(1)}%`
                  : formatNumber(values[year] as number)
                : values[year]}
            </div>
          </div>
        ))}
        {allValuesPresent && 
         selectedYears.length === 2 && 
         typeof values[selectedYears[0]?? 0] === "number" && 
         typeof values[selectedYears[1]?? 0] === "number" && (
          <div className="col-span-2 text-right">
            <div
              className={`font-semibold ${
                selectedYears[1] !== undefined &&
                selectedYears[0] !== undefined &&
                (values[selectedYears[1]] as number) >
                (values[selectedYears[0]] as number)
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {isCurrency && "$"}
              {(
                (values[selectedYears[1] ?? 0] as number) -
                (values[selectedYears[0] ?? 0] as number)
              ).toFixed(isCurrency ? 0 : 1)}
              {isPercentage && "%"}
            </div>
            <div className="text-xs text-gray-500">
              {(
                ((values[selectedYears[1] ?? 0] as number) /
                  (values[selectedYears[0] ?? 0] as number) -
                  1) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
        )}
      </div>
    );
  };

  const ComparisonSection = ({
    title,
    rows,
  }: {
    title: string;
    rows: {
      label: string;
      getValue: (data: ProcessedAcsData) => number | string;
      isPercentage?: boolean;
      isCurrency?: boolean;
    }[];
  }) => {
    return (
      <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        <div className="grid grid-cols-12 gap-4 border-b pb-2 font-medium">
          <div className="col-span-4">Metric</div>
          {selectedYears.map((year) => (
            <div key={year} className="col-span-2 text-right">
              {year}
            </div>
          ))}
          {selectedYears.length === 2 && (
            <div className="col-span-2 text-right">Change</div>
          )}
        </div>
        {rows.map((row, index) => (
          <ComparisonRow
            key={index}
            label={row.label}
            values={Object.fromEntries(
              selectedYears.map((year) => [
                year,
                demographicData[year] ? row.getValue(demographicData[year]!) : "N/A",
              ])
            )}
            isPercentage={row.isPercentage}
            isCurrency={row.isCurrency}
          />
        ))}
      </div>
    );
  };

  const handleYearSelection = (index: number, year: number) => {
    const newYears = [...selectedYears];
    newYears[index] = year;
    setSelectedYears(newYears);
  };

  const addComparisonYear = () => {
    if (selectedYears.length < 4) {
      const newYear = availableYears.find(
        (year) => !selectedYears.includes(year)
      );
      if (newYear) {
        setSelectedYears([...selectedYears, newYear]);
      }
    }
  };

  const removeComparisonYear = (index: number) => {
    if (selectedYears.length > 1) {
      const newYears = [...selectedYears];
      newYears.splice(index, 1);
      setSelectedYears(newYears);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-start space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Population Comparison for {county}, {state}
            <div className="text-sm font-normal text-gray-500">
              (Data from ACS 5-Year Estimates)
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {selectedYears.map((year, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={year}
                  onChange={(e) => handleYearSelection(index, Number(e.target.value))}
                  className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {availableYears
                    .filter(
                      (availableYear) =>
                        !selectedYears.includes(availableYear) ||
                        availableYear === year
                    )
                    .map((availableYear) => (
                      <option key={availableYear} value={availableYear}>
                        {availableYear}
                      </option>
                    ))}
                </select>
                {selectedYears.length > 1 && (
                  <button
                    onClick={() => removeComparisonYear(index)}
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-red-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {selectedYears.length < 4 && (
              <button
                onClick={addComparisonYear}
                className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Year
              </button>
            )}

            <button
              onClick={() => void fetchData()}
              disabled={loading}
              className={`ml-auto rounded-md px-4 py-2 text-white transition-colors ${
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

          {selectedYears.some((year) => demographicData[year]) && (
            <div className="space-y-6">
              <ComparisonSection
                title="Population Overview"
                rows={[
                  {
                    label: "Total Population",
                    getValue: (data) => data.totalPopulation,
                  },
                ]}
              />

              <ComparisonSection
                title="Age Distribution"
                rows={[
                  {
                    label: "Under 5 years",
                    getValue: (data) =>
                      ((data.malePopulation.under5 + data.femalePopulation.under5) /
                        data.totalPopulation) *
                      100,
                    isPercentage: true,
                  },
                  {
                    label: "Under 18 years",
                    getValue: (data) =>
                      ((data.malePopulation.under18 +
                        data.femalePopulation.under18) /
                        data.totalPopulation) *
                      100,
                    isPercentage: true,
                  },
                  {
                    label: "18 to 24 years",
                    getValue: (data) =>
                      ((data.malePopulation.age18to24 +
                        data.femalePopulation.age18to24) /
                        data.totalPopulation) *
                      100,
                    isPercentage: true,
                  },
                  {
                    label: "25 to 44 years",
                    getValue: (data) =>
                      ((data.malePopulation.age25to44 +
                        data.femalePopulation.age25to44) /
                        data.totalPopulation) *
                      100,
                    isPercentage: true,
                  },
                  {
                    label: "45 to 64 years",
                    getValue: (data) =>
                      ((data.malePopulation.age45to64 +
                        data.femalePopulation.age45to64) /
                        data.totalPopulation) *
                      100,
                    isPercentage: true,
                  },
                  {
                    label: "65 years and over",
                    getValue: (data) =>
                      ((data.malePopulation.age65andOver +
                        data.femalePopulation.age65andOver) /
                        data.totalPopulation) *
                      100,
                    isPercentage: true,
                  },
                ]}
              />

              <ComparisonSection
                title="Gender Distribution"
                rows={[
                  {
                    label: "Male",
                    getValue: (data) =>
                      (data.malePopulation.total / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                  {
                    label: "Female",
                    getValue: (data) =>
                      (data.femalePopulation.total / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                ]}
              />

              <ComparisonSection
                title="Race and Ethnicity"
                rows={[
                  {
                    label: "White alone",
                    getValue: (data) =>
                      (data.raceAndHispanic.whiteAlone / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                  {
                    label: "Black or African American alone",
                    getValue: (data) =>
                      (data.raceAndHispanic.blackAlone / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                  {
                    label: "Asian alone",
                    getValue: (data) =>
                      (data.raceAndHispanic.asianAlone / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                  {
                    label: "Hispanic or Latino",
                    getValue: (data) =>
                      (data.raceAndHispanic.hispanicOrLatino / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                ]}
              />

              <ComparisonSection
                title="Income & Employment"
                rows={[
                  {
                    label: "Median Household Income",
                    getValue: (data) => data.incomeEmployment.medianHouseholdIncome,
                    isCurrency: true,
                  },
                  {
                    label: "Per Capita Income",
                    getValue: (data) => data.incomeEmployment.perCapitaIncome,
                    isCurrency: true,
                  },
                  {
                    label: "Below Poverty Line",
                    getValue: (data) => data.incomeEmployment.percentBelowPoverty,
                    isPercentage: true,
                  },
                  {
                    label: "Employment Rate",
                    getValue: (data) => data.incomeEmployment.percentEmployed,
                    isPercentage: true,
                  },
                  {
                    label: "Unemployment Rate",
                    getValue: (data) => data.incomeEmployment.percentUnemployed,
                    isPercentage: true,
                  },
                ]}
              />

              <ComparisonSection
                title="Education"
                rows={[
                  {
                    label: "Less than High School",
                    getValue: (data) =>
                      (data.education.lessThanHS / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                  {
                    label: "High School Graduate",
                    getValue: (data) =>
                      (data.education.hsGraduate / data.totalPopulation) * 100,
                    isPercentage: true,
                  },
                  {
                    label: "Bachelor's Degree or Higher",
                    getValue: (data) =>
                      ((data.education.bachelors + data.education.mastersOrHigher) /
                        data.totalPopulation) *
                      100,
                    isPercentage: true,
                  },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
