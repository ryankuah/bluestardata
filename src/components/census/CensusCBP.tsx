"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import { CensusRow } from "./CensusDataFetcher";

export default function CensusCBP({
  data,
  state,
  county,
}: {
  data: CensusRow[];
  state: string;
  county: string;
}) {
  const columns = React.useMemo(
    () => [
      {
        header: "Industry Code",
        accessorKey: "industryCode",
      },
      {
        header: "Industry Name",
        accessorKey: "industryName",
      },
      {
        header: "Establishments",
        accessorKey: "establishments",
      },
      {
        header: "Employees",
        accessorKey: "employees",
      },
      {
        header: "Annual Payroll",
        accessorKey: "annualPayroll",
      },
    ],
    []
  );

  const [filter, setFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter: filter,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setFilter,
  });

  return (
    <div>
      <h1 className="sticky top-0 z-10 mb-4 w-full bg-white text-xl font-bold text-gray-800">
        2022 CBP for {county}, {state}
      </h1>
      <div className="w-full overflow-y-auto" style={{ maxHeight: "600px" }}>
        {data.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No Data Found</div>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by Industry Name"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded border p-2"
              />
            </div>
            <table className="w-full table-auto rounded-lg bg-white shadow-md">
              <thead className="sticky top-0 z-10 bg-blue-600 text-white">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-2">
                        <div className="flex flex-col items-center w-32"> 
                          <span className="mb-1 font-semibold">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => header.column.toggleSorting(false)}
                              className="w-16 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                            >
                              🔼 Asc
                            </button>
                            <button
                              onClick={() => header.column.toggleSorting(true)}
                              className="w-16 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                            >
                              🔽 Desc
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${row.index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
