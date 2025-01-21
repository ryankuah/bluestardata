"use client";

import React, { useState, useEffect, useCallback } from "react";
import { qcewDataTypes, qcewSizes, qcewOwnerships } from "./qcew-utils";

type Industry = {
  code: string;
  name: string;
};

type BLSResponse = {
  Results?: {
    series: {
      data: {
        year: string;
        period: string;
        periodName: string;
        value: string;
      }[];
    }[];
  };
};

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
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [data, setData] = useState<
    { year: string; period: string; periodName: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const industriesResponse = await fetch("/qcew-industries.txt");
        const industriesText = await industriesResponse.text();

        const parsedIndustries: Industry[] = (() => {
          const seenNames = new Set<string>();
          return industriesText
            .split("\n")
            .map((line: string) => {
              const match = /\d(?=\s+\D*$)/.exec(line);
              const lastNumericIndex = line.lastIndexOf(match?.[0] ?? "");

              const code = line.substring(0, lastNumericIndex + 1).trim();
              const name = line.substring(lastNumericIndex + 1).trim();

              const lowerCaseName = name.toLowerCase();
              if (!seenNames.has(lowerCaseName)) {
                seenNames.add(lowerCaseName);
                return { code, name };
              }

              return null;
            })
            .filter((item): item is Industry => item !== null);
        })();
        setIndustries(parsedIndustries);
      } catch (err) {
        console.error("Error fetching qcew-industries.txt:", err);
        setIndustries([]);
      }
    };

    void fetchIndustries();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const areaCode = stateFips + countyFips;
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

      const json: unknown = await response.json();

      if (
        response.ok &&
        typeof json === "object" &&
        json !== null &&
        "Results" in json &&
        Array.isArray((json as BLSResponse).Results?.series)
      ) {
        const seriesData = (json as BLSResponse).Results?.series[0]?.data ?? [];
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
  }, [dataType, industry, ownership, size, stateFips, countyFips]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, []);

  return (
    <div className="mx-auto flex h-[600px] w-full max-w-5xl flex-col items-start">
      <h1 className="mb-4 text-xl font-bold text-gray-800">
        BLS QCEW Data for {county}, {state}
      </h1>
      <div className="mb-4 w-full rounded bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <label className="mb-2 block font-bold text-gray-700">
              Select Data Type:
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <label className="mb-2 block font-bold text-gray-700">
              Select Industry:
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <label className="mb-2 block font-bold text-gray-700">
              Select Size:
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {qcewSizes.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-2 block font-bold text-gray-700">
              Select Ownership:
            </label>
            <select
              value={ownership}
              onChange={(e) => setOwnership(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className={`mt-6 rounded-md px-4 py-2 text-white ${
              loading
                ? "cursor-not-allowed bg-blue-300"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Loading..." : "Fetch Data"}
          </button>
        </div>
      </div>

      <div className="h-[400px] w-full overflow-y-auto rounded border border-gray-200">
        {loading ? (
          <div className="py-4 text-center text-blue-600">Loading...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            Failed to load data
          </div>
        ) : data.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No Data Found</div>
        ) : (
          <table className="w-full table-auto rounded-lg bg-white shadow-md">
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
