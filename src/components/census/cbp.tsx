"use client";
import React, { useState, useEffect } from "react";

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
  const [data, setData] = useState([]);
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

      const json = await response.json();

      if (response.ok) {
        const filteredData = json
          .slice(1)
          .filter(
            (row: any) =>
              row[2] !== null &&
              row[2] !== "0" &&
              row[3] !== null &&
              row[3] !== "0" &&
              row[4] !== null &&
              row[4] !== "0"
          )
          .filter(
            (row: any, index: number, self: any) =>
              self.findIndex((r: any) => r[1] === row[1]) === index
          );

        setData(filteredData);
      } else {
        throw new Error(json.error || "Failed to fetch data");
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
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4 sticky top-0 bg-white z-10 w-full">
        2022 CBP for {county}, {state}
      </h1>
      <div
        className="overflow-y-auto w-full"
        style={{ maxHeight: "400px" }}
      >
        {loading ? (
          <div className="text-center py-4 text-blue-600">Loading...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">Failed to load data</div>
        ) : data.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No Data Found</div>
        ) : (
          <table className="table-auto w-full bg-white shadow-md rounded-lg">
            <thead className="bg-blue-600 text-white sticky top-0 z-10">
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
                  className={`${
                    index % 2 === 0 ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-2">{row[0]}</td>
                  <td className="px-4 py-2">{row[1]}</td>
                  <td className="px-4 py-2">{row[2]}</td>
                  <td className="px-4 py-2">{row[3]}</td>
                  <td className="px-4 py-2">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
