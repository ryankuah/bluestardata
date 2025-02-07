"use client";

import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";

export type BLSDataSummary = {
    year: string;
    data: Record<string, Record<string, number>>;
};

export default function BLSQCEW({
    data,
    state,
    county,
}: {
    data: BLSDataSummary[];
    state: string;
    county: string;
}) {
    const dataTypes = {
        "1": "All Employees",
        "2": "Number of Establishments",
        "3": "Total Wages (in thousands)",
        "4": "Average Weekly Wage",
        "5": "Average Annual Pay",
    };

    const [expandedGraph, setExpandedGraph] = useState<string | null>(null);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start space-y-2">
            <h1 className="mb-4 text-2xl font-bold text-gray-800">
                BLS QCEW Summary for {county}, {state}
            </h1>

            {Object.entries(dataTypes).map(([code, label]) => {
                const isExpanded = expandedGraph === code;

                return (
                    <div
                        key={code}
                        className={`w-full border border-gray-200 rounded-lg transition-all duration-200 ${
                            isExpanded ? "bg-white shadow-lg" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                    >
                        <button
                            onClick={() => setExpandedGraph(isExpanded ? null : code)}
                            className="flex w-full items-center justify-between px-6 py-4 text-lg font-semibold text-gray-700 transition-all duration-150"
                        >
                            {label}
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {isExpanded && (
                            <div className="p-6 border-t border-gray-300 rounded-b-lg">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={data}>
                                        <XAxis dataKey="year" />
                                        <YAxis
                                            tickFormatter={(value) =>
                                                value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value
                                            }
                                        />
                                        <Tooltip formatter={(value: number) => value.toLocaleString()} />
                                        <Legend />
                                        {Object.keys(data[0]?.data?.[code] || {}).map((industry, idx) => (
                                            <Line
                                                key={industry}
                                                type="monotone"
                                                dataKey={`data.${code}.${industry}`}
                                                stroke={["#8884d8", "#82ca9d", "#ff7300", "#ffbb28", "#d62728", "#17becf"][idx]}
                                                name={industry}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
