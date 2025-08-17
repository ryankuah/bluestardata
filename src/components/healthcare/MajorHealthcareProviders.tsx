"use client";

import React, { useEffect, useMemo, useState } from "react";

interface Provider {
  number: string;
  name: string;
  address: string;
  primaryTaxonomy: string;
  otherTaxonomies: string;
}

interface Hospital {
  name: string;
  address: string;
  city: string;
  state: string;
  statefips: string;
  type: string;
  population: number;
  county: string;
  countyfips: number;
  naics_desc: string;
  owner: string;
  beds: number;
  trauma: string;
}

export default function MajorHealthcareProviders({
  state,
  county,
}: {
  state: string;
  county: string;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "primaryTaxonomy">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  // Hospital table state
  const [hospitalPage, setHospitalPage] = useState(1);
  const [hospitalSortBy, setHospitalSortBy] = useState<
    "name" | "type" | "beds" | "trauma"
  >("name");
  const [hospitalSortAsc, setHospitalSortAsc] = useState(true);
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("All");

  const pageSize = 10;

  const allowedHospitalTypes = [
    "In Home Supportive Care",
    "Surgery Clinic/Center",
    "Home Health",
    "Dentist",
    "Clinic/Center",
    "Specialist",
    "Internal Medicine, Pulmonary Disease",
    "Clinic/Center, Rehabilitation",
    "Nurse Practitioner, Psych/Mental Health",
    "Clinic/Center, Mental Health",
    "Family Medicine, Adult Medicine",
    "Clinic/Center, Developmental Disabilities",
    "Obstetrics & Gynecology",
    "Internal Medicine, Nephrology",
    "Orthopaedic Surgery",
    "Psychiatry & Neurology, Neurology",
    "Anesthesiology",
    "Speech-Language Pathologist",
    "Radiology, Diagnostic Radiology",
    "Pediatrics, Pediatric Pulmonology",
    "Psychologist, Addiction",
    "Skilled Nursing Facility",
    "Psychiatric Hospital",
    "Community Based Residential Treatment Facility",
    "Urology",
    "Clinic/Center, Urgent Care",
    "Clinic/Center, Birthing",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both providers and hospitals from the same API
        const response = await fetch(
          `/api/healthcare?state=${state}&county=${county}`,
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setProviders(data.providers || []);
        setHospitals(data.hospitals || []);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state, county]);

  const typeOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        providers
          .filter((p) => allowedHospitalTypes.includes(p.primaryTaxonomy))
          .map((p) => p.primaryTaxonomy)
          .filter(Boolean),
      ),
    );
    return ["All", ...types];
  }, [providers]);

  const filteredProviders = useMemo(() => {
    return providers
      .filter((p) => allowedHospitalTypes.includes(p.primaryTaxonomy))
      .filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(
        (p) => selectedType === "All" || p.primaryTaxonomy === selectedType,
      )
      .sort((a, b) => {
        const fieldA = a[sortBy]?.toLowerCase() || "";
        const fieldB = b[sortBy]?.toLowerCase() || "";
        return sortAsc
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      });
  }, [providers, searchTerm, selectedType, sortBy, sortAsc]);

  const ownerOptions = useMemo(() => {
    const owners = Array.from(
      new Set(hospitals.map((h) => h.owner).filter(Boolean)),
    );
    return ["All", ...owners];
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    return hospitals
      .filter((h) =>
        h.name?.toLowerCase().includes(hospitalSearchTerm.toLowerCase()),
      )
      .filter((h) => selectedOwner === "All" || h.owner === selectedOwner)
      .sort((a, b) => {
        let fieldA, fieldB;
        if (hospitalSortBy === "beds") {
          fieldA = a.beds || 0;
          fieldB = b.beds || 0;
          return hospitalSortAsc ? fieldA - fieldB : fieldB - fieldA;
        } else {
          fieldA = a[hospitalSortBy]?.toString().toLowerCase() || "";
          fieldB = b[hospitalSortBy]?.toString().toLowerCase() || "";
          return hospitalSortAsc
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }
      });
  }, [
    hospitals,
    hospitalSearchTerm,
    selectedOwner,
    hospitalSortBy,
    hospitalSortAsc,
  ]);

  const paginatedData = filteredProviders.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProviders.length / pageSize),
  );

  const paginatedHospitals = filteredHospitals.slice(
    (hospitalPage - 1) * pageSize,
    hospitalPage * pageSize,
  );
  const totalHospitalPages = Math.max(
    1,
    Math.ceil(filteredHospitals.length / pageSize),
  );

  const handleSort = (field: "name" | "primaryTaxonomy") => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
    setPage(1);
  };

  const handleHospitalSort = (field: "name" | "type" | "beds" | "trauma") => {
    if (hospitalSortBy === field) {
      setHospitalSortAsc(!hospitalSortAsc);
    } else {
      setHospitalSortBy(field);
      setHospitalSortAsc(true);
    }
    setHospitalPage(1);
  };

  return (
    <div className="w-full space-y-6">
      {/* Hospitals Table */}
      <div className="w-full rounded-lg bg-white p-4 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">
          Hospitals (Total: {filteredHospitals.length})
        </h2>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search hospitals by name..."
            className="w-full rounded border p-2 sm:w-64"
            value={hospitalSearchTerm}
            onChange={(e) => {
              setHospitalSearchTerm(e.target.value);
              setHospitalPage(1);
            }}
          />
          <select
            className="w-full rounded border p-2 sm:w-64"
            value={selectedOwner}
            onChange={(e) => {
              setSelectedOwner(e.target.value);
              setHospitalPage(1);
            }}
          >
            {ownerOptions.map((owner) => (
              <option key={owner}>{owner}</option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500">Loading hospitals...</p>}
        {!loading && filteredHospitals.length === 0 && (
          <p className="text-gray-500">No hospitals found.</p>
        )}

        {!loading && filteredHospitals.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      className="cursor-pointer p-2 text-left"
                      onClick={() => handleHospitalSort("name")}
                    >
                      Hospital Name{" "}
                      {hospitalSortBy === "name"
                        ? hospitalSortAsc
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th className="p-2 text-left">Address</th>
                    <th className="p-2 text-left">City</th>
                    <th
                      className="cursor-pointer p-2 text-left"
                      onClick={() => handleHospitalSort("type")}
                    >
                      Type{" "}
                      {hospitalSortBy === "type"
                        ? hospitalSortAsc
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th
                      className="cursor-pointer p-2 text-left"
                      onClick={() => handleHospitalSort("beds")}
                    >
                      Beds{" "}
                      {hospitalSortBy === "beds"
                        ? hospitalSortAsc
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th
                      className="cursor-pointer p-2 text-left"
                      onClick={() => handleHospitalSort("trauma")}
                    >
                      Trauma Level{" "}
                      {hospitalSortBy === "trauma"
                        ? hospitalSortAsc
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th className="p-2 text-left">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHospitals.map((h, index) => (
                    <tr
                      key={`${h.name}-${index}`}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-2 font-medium">{h.name || "Unnamed"}</td>
                      <td className="p-2">{h.address || "N/A"}</td>
                      <td className="p-2">{h.city || "N/A"}</td>
                      <td className="p-2">{h.type}</td>
                      <td className="p-2 text-center">{h.beds || "N/A"}</td>
                      <td className="p-2">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            h.trauma === "LEVEL I"
                              ? "bg-red-100 text-red-800"
                              : h.trauma === "LEVEL II"
                                ? "bg-orange-100 text-orange-800"
                                : h.trauma === "LEVEL III"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : h.trauma === "LEVEL IV"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {h.trauma || "N/A"}
                        </span>
                      </td>
                      <td className="p-2">{h.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <button
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                onClick={() => setHospitalPage((p) => Math.max(1, p - 1))}
                disabled={hospitalPage === 1}
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {hospitalPage} of {totalHospitalPages}
              </span>
              <button
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                onClick={() =>
                  setHospitalPage((p) => Math.min(totalHospitalPages, p + 1))
                }
                disabled={hospitalPage === totalHospitalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
      {/* Healthcare Providers Table */}
      <div className="w-full rounded-lg bg-white p-4 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">
          Major Healthcare Providers (Total: {filteredProviders.length})
        </h2>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full rounded border p-2 sm:w-64"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="w-full rounded border p-2 sm:w-64"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
          >
            {typeOptions.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        {loading && <p className="text-gray-500">Loading providers...</p>}
        {error && <p className="text-red-600">⚠️ {error}</p>}
        {!loading && !error && filteredProviders.length === 0 && (
          <p className="text-gray-500">No providers found.</p>
        )}

        {!loading && !error && filteredProviders.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      className="cursor-pointer p-2 text-left"
                      onClick={() => handleSort("name")}
                    >
                      Organization{" "}
                      {sortBy === "name" ? (sortAsc ? "▲" : "▼") : ""}
                    </th>
                    <th className="p-2 text-left">Address</th>
                    <th
                      className="cursor-pointer p-2 text-left"
                      onClick={() => handleSort("primaryTaxonomy")}
                    >
                      Type{" "}
                      {sortBy === "primaryTaxonomy"
                        ? sortAsc
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((p) => (
                    <tr key={p.number} className="border-t hover:bg-gray-50">
                      <td className="p-2">{p.name || "Unnamed"}</td>
                      <td className="p-2">{p.address || "N/A"}</td>
                      <td className="p-2">{p.primaryTaxonomy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <button
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
