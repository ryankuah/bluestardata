"use client";
import { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { type ColDef, type ColDefField } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { type Header } from "./types";

export default function Table<T extends object>({
  data,
  headers,
  county,
  state,
  name,
  search,
}: {
  data: T[];
  headers: Header[];
  county: string;
  state: string;
  name: string;
  search?: string;
}) {
  const [filter, setFilter] = useState("");

  const columnDefs: ColDef<T>[] = headers.map((header) => ({
    headerName: header.header,
    field: header.accessorKey as ColDefField<T>,
    sortable: true,
    filter: true,
  }));

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
            {search && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder={search}
                  value={filter}
                  onChange={onFilterTextBoxChanged}
                  className="w-full rounded border p-2"
                />
              </div>
            )}
            <div
              className="ag-theme-alpine"
              style={{ height: "600px", width: "100%" }}
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
                suppressBrowserResizeObserver={true}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

