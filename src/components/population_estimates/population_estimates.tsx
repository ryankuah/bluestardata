'use client';

import React, { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";

interface PopulationDashboardProps {
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
}

interface PopulationData {
  density: number;
  region: string;
  state: string;
  county: string;
  geoId: string;
  funcStat: string;
  pop: number;
  lastUpdate: string;
  division: string;
  primGeoFlag: string;
  dateCode: string;
}

// Mapping dateCode to corresponding years (based on your dataset context)
const dateCodeToYear = (dateCode: string): string => {
  const baseYear = 2010; // April 1, 2010, is the base year for this dataset.
  const offset = parseInt(dateCode, 10); // Convert dateCode to an integer offset.
  return (baseYear + offset - 1).toString(); // Map dateCode to actual year.
};

export default function PopulationEstimates({
  state,
  county,
  stateFips,
  countyFips,
}: PopulationDashboardProps) {
  const [data, setData] = useState<PopulationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2019);

  const availableYears = [2019, 2018]; // Adjust as needed for your dataset.

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

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to fetch data');
      }

      if (Array.isArray(json)) {
        setData(json);
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (err) {
      console.error("Error fetching population data:", err);
      setData([]);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [stateFips, countyFips, selectedYear]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const formatNumber = (num: number) => num.toLocaleString();

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
              onClick={fetchData}
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

          <div className="mb-4 flex items-center gap-2 rounded-md bg-blue-50 p-3 text-blue-700">
            <Info className="h-5 w-5" />
            <span>Showing population estimates for the selected year. The Census Bureau updates these estimates annually.</span>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700">
              <AlertCircle className="h-5 w-5" /> <span>{error}</span> </div> )}

          {data.length > 0 && (
        <div className="mb-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.map((row) => ({
                ...row,
                year: dateCodeToYear(row.dateCode), // Convert dateCode to year
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                label={{ value: 'Year', position: 'bottom' }}
              />
              <YAxis 
                label={{ value: 'Population', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), "Population"]}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="pop" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Population"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        {loading ? (
          <div className="py-8 text-center text-blue-600">Loading...</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No Data Found</div>
        ) : (
          <table className="w-full table-auto">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Year</th>
                <th className="px-4 py-2 text-left">Population</th>
                <th className="px-4 py-2 text-left">Density (per sq. mile)</th>
                <th className="px-4 py-2 text-left">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr 
                  key={index} 
                  className={`border-t border-gray-200 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-2">{dateCodeToYear(row.dateCode)}</td>
                  <td className="px-4 py-2">{formatNumber(row.pop)}</td>
                  <td className="px-4 py-2">{row.density.toFixed(2)}</td>
                  <td className="px-4 py-2">{row.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
          </CardContent>
        </Card>
      </div>
        );
}