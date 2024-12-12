"use client";

import { addUSA, fredStates } from "./scripts";
export default function Page() {
  return (
    <div className="m-4 flex flex-col">
      <button onClick={async () => addUSA()}>Add USA</button>
      <button onClick={async () => fredStates()}>Populate Fred States</button>
    </div>
  );
}
