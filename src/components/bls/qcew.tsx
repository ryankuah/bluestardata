"use client";

import React, { useState, useEffect } from "react";
import { qcewDataTypes, qcewSizes, qcewOwnerships } from "./qcew-utils";

export default function BLSQCEW({
    state,
    county,
    stateFips,
    countyFips,
}: {
    state: string;
    county: string;
    stateFips: string;
    countyFips: string;
}) {
    const [dataType, setDataType] = useState("1");
    const [industry, setIndustry] = useState("10     10");
    const [size, setSize] = useState("0");
    const [ownership, setOwnership] = useState("5"); 
    const [industries, setIndustries] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                const industriesResponse = await fetch("/qcew-industries.txt");
                const industriesText = await industriesResponse.text();

                const parsedIndustries = (() => {
                    const seenNames = new Set<string>();
                    return industriesText
                        .split("\n")
                        .map((line: string) => {
                            const lastNumericIndex = line.lastIndexOf(line.match(/\d(?=\s+\D*$)/)?.[0] ?? "");

                            const code = line.substring(0, lastNumericIndex + 1).trim();
                            const name = line.substring(lastNumericIndex + 1).trim();

                            const lowerCaseName = name.toLowerCase();
                            if (!seenNames.has(lowerCaseName)) {
                                seenNames.add(lowerCaseName);
                                return { code, name };
                            }

                            return null;
                        })
                        .filter(Boolean);
                })();
                setIndustries(parsedIndustries as any[]);
            } catch (err) {
                console.error("Error fetching qcew-industries.txt:", err);
                setIndustries([]);
            }
        };

        fetchIndustries();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(false);

        try {
            const areaCode = stateFips + "" + countyFips;
            const seriesId = `ENU${areaCode}${dataType}${size}${ownership}${industry.split(" ")[0]}`;

            const response = await fetch("/api/bls", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seriesid: [seriesId],
                    startyear: "2010",
                    endyear: "2023",
                }),
            });

            const json = await response.json();

            if (response.ok && json.Results) {
                const seriesData = json.Results.series[0]?.data || [];
                setData(seriesData);
            } else {
                throw new Error("Failed to fetch data");
            }
        } catch (err) {
            console.error("Error fetching QCEW data:", err);
            setData([]);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex flex-col items-start w-full max-w-5xl mx-auto h-[600px]">
            <h1 className="text-xl font-bold text-gray-800 mb-4">
                BLS QCEW Data for {county}, {state}
            </h1>
            <div className="bg-white rounded p-4 mb-4 w-full">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-gray-700 font-bold mb-2">
                            Select Data Type:
                        </label>
                        <select
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select a Data Type</option>
                            {qcewDataTypes.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-gray-700 font-bold mb-2">
                            Select Industry:
                        </label>
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select an Industry</option>
                            {industries.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-gray-700 font-bold mb-2">
                            Select Size:
                        </label>
                        <select
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            {qcewSizes.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-gray-700 font-bold mb-2">
                            Select Ownership:
                        </label>
                        <select
                            value={ownership}
                            onChange={(e) => setOwnership(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Ownership</option>
                            {qcewOwnerships.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className={`py-2 px-4 text-white rounded-md mt-6 ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {loading ? "Loading..." : "Fetch Data"}
                    </button>
                </div>
            </div>

            <div className="w-full h-[400px] overflow-y-auto border border-gray-200 rounded">
                {loading ? (
                    <div className="text-center py-4 text-blue-600">Loading...</div>
                ) : error ? (
                    <div className="text-center py-4 text-red-500">Failed to load data</div>
                ) : data.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No Data Found</div>
                ) : (
                    <table className="table-auto w-full bg-white shadow-md rounded-lg">
                        <thead className="sticky top-0 bg-blue-600 text-white">
                            <tr>
                                <th className="px-4 py-2">Year</th>
                                <th className="px-4 py-2">Period</th>
                                <th className="px-4 py-2">Period Name</th>
                                <th className="px-4 py-2">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr
                                    key={index}
                                    className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
                                >
                                    <td className="px-4 py-2">{row.year}</td>
                                    <td className="px-4 py-2">{row.period}</td>
                                    <td className="px-4 py-2">{row.periodName}</td>
                                    <td className="px-4 py-2">{row.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
