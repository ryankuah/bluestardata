"use client";
import { addStateData, addCountyData } from "@/app/scripts/scripts";
import { addFredIds } from "@/utils/fred/utils";
export default function Page() {
  return (
    <div className="m-4 flex flex-col">
      <button onClick={async () => addStateData()}>Add State Data</button>
      <button onClick={async () => addCountyData()}>Add County Data</button>
      <button onClick={async () => addFredIds()}>Add Fred Ids</button>
    </div>
  );
}
