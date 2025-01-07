"use client";

import {
  addUSA,
  fredStates,
  addStateBorders,
  addCountyBorders,
  addFPCodes,
  addUSData,
  addUSCountyData,
} from "@/app/scripts/scripts";
export default function Page() {
  return (
    <div className="m-4 flex flex-col">
      <button onClick={async () => addUSA()}>Add USA</button>
      <button onClick={async () => fredStates()}>Populate Fred States</button>
      <button onClick={async () => addStateBorders()}>Add State Borders</button>
      <button onClick={async () => addCountyBorders()}>
        Add County Borders
      </button>
      <button onClick={async () => addFPCodes()}>Add Fips Codes</button>
      <button onClick={async () => addUSData()}>Add US Data</button>
      <button onClick={async () => addUSCountyData()}>
        Add US County Data
      </button>
    </div>
  );
}
