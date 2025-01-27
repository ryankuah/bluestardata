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

interface CharAgeGroupsData {
  ageGroup: string;
  pop: number;
  sex: string;
  race: string;
  hisp: string;
  state: string;
  county: string;
  dateCode: string;
}

// Add these utility functions at the top with other imports
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

const calculatePercentage = (part: number, total: number): string => {
  return ((part / total) * 100).toFixed(1) + '%';
};

const RACE_LABELS: Record<string, string> = {
  '1': 'White',
  '2': 'Black',
  '3': 'Asian',
  '4': 'Pacific Islander',
  '5': 'Two or More Races',
  '6': 'White Combined',
  '7': 'Black Combined',
  '8': 'Am. Indian/Alaska Native',
  '9': 'Asian Combined',
  '10': 'Pacific Islander Combined',
};

const SEX_LABELS: Record<string, string> = {
  '1': 'Male',
  '2': 'Female',
};

const HISPANIC_LABELS: Record<string, string> = {
  '1': 'Hispanic',
  '2': 'Non-Hispanic',
};

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
  const [populationData, setPopulationData] = useState<PopulationData[]>([]);
  const [charAgeGroupsData, setCharAgeGroupsData] = useState<CharAgeGroupsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2019);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10); // Rows per page state

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

      const json = await response.json();

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

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = charAgeGroupsData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(charAgeGroupsData.length / rowsPerPage);

  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1); // Reset to the first page when changing rows per page
          }}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`rounded-md px-4 py-2 text-white transition-colors ${
            currentPage === 1
              ? "cursor-not-allowed bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`rounded-md px-4 py-2 text-white transition-colors ${
            currentPage === totalPages
              ? "cursor-not-allowed bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );

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

          {populationData.length > 0 && (
            <div className="mb-6 h-64">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={populationData.map((row) => ({
                    ...row,
                    year: dateCodeToYear(row.dateCode),
                  }))}
                  margin={{ top: 20, right: 40, left: 20, bottom: 40 }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="75%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ddd" />
                  <XAxis
                    dataKey="year"
                    label={{
                      value: 'Year',
                      position: 'insideBottom',
                      dy: 10,
                      style: { fontSize: '14px', fontWeight: 'bold', fill: '#666' },
                    }}
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#999', strokeWidth: 1 }}
                    tickLine={{ stroke: '#999', strokeWidth: 0.5 }}
                  />
                  <YAxis
                    label={{
                      value: 'Population',
                      angle: -90,
                      position: 'insideLeft',
                      dx: -10,
                      style: { fontSize: '14px', fontWeight: 'bold', fill: '#666' },
                    }}
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#999', strokeWidth: 1 }}
                    tickLine={{ stroke: '#999', strokeWidth: 0.5 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}
                    itemStyle={{ fontSize: '12px', color: '#374151' }}
                    formatter={(value: number) => [formatNumber(value), 'Population']}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="pop"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="Population"
                    dot={{
                      fill: '#2563eb',
                      stroke: '#fff',
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{
                      fill: '#2563eb',
                      stroke: '#2563eb',
                      strokeWidth: 4,
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="overflow-x-auto mt-40 rounded-lg border border-gray-200">
            {loading ? (
              <div className="py-8 text-center text-blue-600">Loading...</div>
            ) : populationData.length === 0 ? (
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
                  {populationData.map((row, index) => (
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

          {/* Display CharAgeGroups Data with Pagination */}
          {charAgeGroupsData.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">Demographics</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full table-auto">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-2 text-left">Age Group</th>
                      <th className="px-4 py-2 text-left">Population</th>
                      <th className="px-4 py-2 text-left">Sex</th>
                      <th className="px-4 py-2 text-left">Race</th>
                      <th className="px-4 py-2 text-left">Hispanic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-t border-gray-200 ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-2">{row.ageGroup}</td>
                        <td className="px-4 py-2">{formatNumber(row.pop)}</td>
                        <td className="px-4 py-2">{SEX_LABELS[row.sex] || row.sex}</td>
                        <td className="px-4 py-2">{RACE_LABELS[row.race] || row.race}</td>
                        <td className="px-4 py-2">{HISPANIC_LABELS[row.hisp] || row.hisp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationControls />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}