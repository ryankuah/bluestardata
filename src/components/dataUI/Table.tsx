"use client";
import { useState } from "react";
import { AgGridReact } from "ag-grid-react"; // Import AgGridReact
import "ag-grid-community/styles/ag-grid.css"; // Core CSS for AG Grid
import "ag-grid-community/styles/ag-theme-alpine.css"; // Theme for AG Grid

import { type Header } from "./types";

export default function Table<T extends object>({
  data,
  headers,
  county,
  state,
  name,
}: {
  data: T[];
  headers: Header[];
  county: string;
  state: string;
  name: string;
}) {
  const [filter, setFilter] = useState("");

  // Convert headers to AG Grid column definitions
  const columnDefs = headers.map((header) => ({
    headerName: header.header, // Map header name
    field: header.accessorKey, // Map field to access data
    sortable: true, // Enable sorting
    filter: true, // Enable filtering
  }));

  // Apply global filter to the grid
  const onFilterTextBoxChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  return (
    <div>
      <h1 className="sticky top-0 z-10 mb-4 w-full bg-white text-xl font-bold text-gray-800">
        {name} for {county}, {state}
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
                onChange={onFilterTextBoxChanged}
                className="w-full rounded border p-2"
              />
            </div>
            <div
              className="ag-theme-alpine" // Apply AG Grid theme
              style={{ height: "600px", width: "100%" }} // Set height and width
            >
              <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={{
                  filter: true,
                  sortable: true,
                  resizable: true,
                }}
                domLayout="autoHeight"
                pagination={true}
                paginationPageSize={10}
                quickFilterText={filter}
                suppressBrowserResizeObserver={true} // 👈 Disable ResizeObserver
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}