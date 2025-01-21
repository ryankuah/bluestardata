"use client";
import React, { useState, useEffect } from "react";

type CensusRow = {
  industryCode: string | undefined;
  industryName: string | undefined;
  establishments: string | undefined;
  employees: string | undefined;
  annualPayroll: string | undefined;
};

type CensusApiResponse = Array<[string, string, string, string, string]>;

type CensusError = {
  error: string;
};

export default function CensusCBP({
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
  const [data, setData] = useState<CensusRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/census", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stateFips, countyFips }),
      });

      const json: unknown = await response.json();

      if (response.ok && Array.isArray(json)) {
        const filteredData = (json as CensusApiResponse)
          .slice(1)
          .filter(
            (row): row is [string, string, string, string, string] =>
              row.length >= 5 &&
              row[2] !== null &&
              row[2] !== "0" &&
              row[3] !== null &&
              row[3] !== "0" &&
              row[4] !== null &&
              row[4] !== "0",
          )
          .filter(
            (row, index, self) =>
              self.findIndex((r) => r[1] === row[1]) === index,
          )
          .map((row) => ({
            industryCode: row[0],
            industryName: row[1],
            establishments: row[2],
            employees: row[3],
            annualPayroll: row[4],
          }));

        setData(filteredData);
      } else if (
        json &&
        typeof json === "object" &&
        "error" in (json as CensusError) &&
        typeof (json as CensusError).error === "string"
      ) {
        throw new Error((json as CensusError).error);
      } else {
        throw new Error("Unexpected response structure");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  return (
    <div>
      <h1 className="sticky top-0 z-10 mb-4 w-full bg-white text-xl font-bold text-gray-800">
        2022 CBP for {county}, {state}
      </h1>
      <div className="w-full overflow-y-auto" style={{ maxHeight: "400px" }}>
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
            <thead className="sticky top-0 z-10 bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2">Industry Code</th>
                <th className="px-4 py-2">Industry Name</th>
                <th className="px-4 py-2">Establishments</th>
                <th className="px-4 py-2">Employees</th>
                <th className="px-4 py-2">Annual Payroll</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
                >
                  <td className="px-4 py-2">{row.industryCode}</td>
                  <td className="px-4 py-2">{row.industryName}</td>
                  <td className="px-4 py-2">{row.establishments}</td>
                  <td className="px-4 py-2">{row.employees}</td>
                  <td className="px-4 py-2">{row.annualPayroll}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
