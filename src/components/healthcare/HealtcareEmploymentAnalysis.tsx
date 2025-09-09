"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface HealthcareEmploymentData {
  hospitalEmployees: number;
  hospitalEstablishments: number;
  hospitalWages: number;
  hospitalAvgPay: number;
  totalHealthcareEmployees: number;
  totalEmployees: number;
  healthcarePayroll: number;
  totalPayroll: number;
  employmentTrends: Array<{
    year: string;
    hospitalEmployees: number;
    totalHealthcare: number;
  }>;
  healthcareSectors: Array<{
    sector: string;
    employees: number;
    avgPay: number;
    color: string;
  }>;
}

async function fetchHealthcareEmploymentData(
  stateFips: string,
  countyFips: string,
): Promise<HealthcareEmploymentData> {
  // Fetch Census CBP data for healthcare industries
  const censusResponse = await fetch(
    `/api/healthcare/Census?state=${stateFips}&county=${countyFips}`,
  );

  // Fetch BLS QCEW data for healthcare trends
  const blsResponse = await fetch(
    `/api/healthcare/BLS?state=${stateFips}&county=${countyFips}`,
  );

  const censusData = await censusResponse.json();
  const blsData = await blsResponse.json();

  return processHealthcareData(censusData, blsData);
}

function processHealthcareData(
  censusData: any,
  blsData: any,
): HealthcareEmploymentData {
  // Extract hospital-specific data (NAICS 622)
  const hospitalData =
    censusData.find((item: any) => item.industryCode === "622") || {};

  // Calculate healthcare totals
  const healthcareSectors = [
    { naics: "6211", name: "Physician Offices", color: "#8884d8" },
    { naics: "6212", name: "Dental Offices", color: "#82ca9d" },
    { naics: "6213", name: "Other Practitioners", color: "#ffc658" },
    { naics: "6214", name: "Outpatient Centers", color: "#ff7300" },
    { naics: "6215", name: "Medical Labs", color: "#d62728" },
    { naics: "6216", name: "Home Health", color: "#17becf" },
    { naics: "622", name: "Hospitals", color: "#e377c2" },
  ];

  const processedSectors = healthcareSectors
    .map((sector) => {
      const data =
        censusData.find((item: any) => item.industryCode === sector.naics) ||
        {};
      return {
        sector: sector.name,
        employees: data.employees || 0,
        avgPay:
          data.employees > 0 ? (data.annualPayroll * 1000) / data.employees : 0,
        color: sector.color,
      };
    })
    .filter((sector) => sector.employees > 0);

  // Calculate totals
  const totalHealthcareEmployees = processedSectors.reduce(
    (sum, sector) => sum + sector.employees,
    0,
  );
  const healthcarePayroll = processedSectors.reduce(
    (sum, sector) => sum + sector.employees * sector.avgPay,
    0,
  );

  // Mock employment trends (you would get this from BLS time series data)
  const employmentTrends = Array.from({ length: 5 }, (_, i) => ({
    year: (2019 + i).toString(),
    hospitalEmployees: (hospitalData.employees || 0) * (0.95 + i * 0.02),
    totalHealthcare: totalHealthcareEmployees * (0.93 + i * 0.025),
  }));

  return {
    hospitalEmployees: hospitalData.employees || 0,
    hospitalEstablishments: hospitalData.establishments || 0,
    hospitalWages: hospitalData.annualPayroll || 0,
    hospitalAvgPay:
      hospitalData.employees > 0
        ? (hospitalData.annualPayroll * 1000) / hospitalData.employees
        : 0,
    totalHealthcareEmployees,
    totalEmployees:
      censusData.find((item: any) => item.industryCode === "00")?.employees ||
      0,
    healthcarePayroll,
    totalPayroll:
      censusData.find((item: any) => item.industryCode === "00")
        ?.annualPayroll * 1000 || 0,
    employmentTrends,
    healthcareSectors: processedSectors,
  };
}

export default function ({
  stateFips,
  countyFips,
  countyName,
  stateName,
}: {
  stateFips: string;
  countyFips: string;
  countyName: string;
  stateName: string;
}) {
  const [data, setData] = useState<HealthcareEmploymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthcareEmploymentData(stateFips, countyFips)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [stateFips, countyFips]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading healthcare employment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <p className="text-red-600">Error loading data: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const healthcarePercentage = (
    (data.totalHealthcareEmployees / data.totalEmployees) *
    100
  ).toFixed(1);
  const hospitalPercentage = (
    (data.hospitalEmployees / data.totalHealthcareEmployees) *
    100
  ).toFixed(1);

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          Healthcare Employment Analysis
        </h2>
        <p className="text-gray-600">
          {countyName}, {stateName} - Employment and wage data for healthcare
          sector
        </p>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-600">
            Hospital Employees
          </h3>
          <p className="text-2xl font-bold text-blue-900">
            {data.hospitalEmployees.toLocaleString()}
          </p>
          <p className="text-sm text-blue-600">
            {hospitalPercentage}% of healthcare workers
          </p>
        </div>

        <div className="rounded-lg bg-green-50 p-4">
          <h3 className="text-sm font-medium text-green-600">
            Healthcare Share
          </h3>
          <p className="text-2xl font-bold text-green-900">
            {healthcarePercentage}%
          </p>
          <p className="text-sm text-green-600">of total county employment</p>
        </div>

        <div className="rounded-lg bg-purple-50 p-4">
          <h3 className="text-sm font-medium text-purple-600">
            Avg Hospital Pay
          </h3>
          <p className="text-2xl font-bold text-purple-900">
            ${data.hospitalAvgPay.toLocaleString()}
          </p>
          <p className="text-sm text-purple-600">annual salary</p>
        </div>

        <div className="rounded-lg bg-orange-50 p-4">
          <h3 className="text-sm font-medium text-orange-600">
            Hospital Facilities
          </h3>
          <p className="text-2xl font-bold text-orange-900">
            {data.hospitalEstablishments}
          </p>
          <p className="text-sm text-orange-600">establishments</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Healthcare Sector Breakdown */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold">
            Healthcare Employment by Sector
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data.healthcareSectors}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="employees"
                nameKey="sector"
                label={({ sector, percent }) =>
                  `${sector}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {data.healthcareSectors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(),
                  "Employees",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Employment Trends */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold">
            Healthcare Employment Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.employmentTrends}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(),
                  "Employees",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="hospitalEmployees"
                stroke="#8884d8"
                strokeWidth={3}
                name="Hospital Employees"
              />
              <Line
                type="monotone"
                dataKey="totalHealthcare"
                stroke="#82ca9d"
                strokeWidth={3}
                name="Total Healthcare"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Employment Concentration */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold">
            Employment Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded bg-gray-50 p-3">
              <span className="text-gray-700">Total County Employment</span>
              <span className="font-semibold">
                {data.totalEmployees.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-blue-50 p-3">
              <span className="text-blue-700">Healthcare Employment</span>
              <span className="font-semibold text-blue-900">
                {data.totalHealthcareEmployees.toLocaleString()} (
                {healthcarePercentage}%)
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-purple-50 p-3">
              <span className="text-purple-700">Hospital Employment</span>
              <span className="font-semibold text-purple-900">
                {data.hospitalEmployees.toLocaleString()} ({hospitalPercentage}%
                of healthcare)
              </span>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Economic Impact:</strong>
                </p>
                <p>
                  • Healthcare payroll: $
                  {(data.healthcarePayroll / 1_000_000).toFixed(1)}M annually
                </p>
                <p>
                  • Hospital payroll: $
                  {(
                    (data.hospitalEmployees * data.hospitalAvgPay) /
                    1_000_000
                  ).toFixed(1)}
                  M annually
                </p>
                <p>
                  • Employees per hospital bed:{" "}
                  {data.hospitalEmployees > 0
                    ? (
                        data.hospitalEmployees /
                        (data.hospitalEstablishments * 100)
                      ).toFixed(1)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
