'use client';

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
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.census.gov/data/cbp?get=NAME&for=county:${countyFips}&in=state:${stateFips}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stateFips, countyFips]);

  return (
    <div>
      <h1>Census CBP Data</h1>
      <p>
        <strong>State:</strong> {state}
      </p>
      <p>
        <strong>County:</strong> {county}
      </p>
      <p>
        <strong>Data:</strong>
      </p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
