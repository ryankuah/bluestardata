// src/components/bls/HealthcareOEWS.tsx
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type HealthcareDataSummary = {
  occupationTitle: string;
  employment: number;
  meanWage: number;
};

export default function HealthcareOEWS({
  data,
  state,
  county,
}: {
  data: HealthcareDataSummary[];
  state: string;
  county: string;
}) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  if (!data || data.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start space-y-2">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">
          Healthcare Employment Data for {county}, {state}
        </h1>
        <div className="p-6 text-center text-gray-600">
          No healthcare employment data available for this area
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-start space-y-4">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">
        Healthcare Employment Data for {county}, {state}
      </h1>

      {/* Simple Chart */}
      <div className="w-full rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Employment by Healthcare Occupation
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <XAxis
              dataKey="occupationTitle"
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={10}
            />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip formatter={(value: number) => formatNumber(value)} />
            <Bar dataKey="employment" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Simple Table */}
      <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Healthcare Employment & Wages
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Occupation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Employment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Mean Annual Wage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr
                  key={item.occupationTitle}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.occupationTitle}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatNumber(item.employment)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatCurrency(item.meanWage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
