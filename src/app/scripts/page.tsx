import {
  addStateData,
  addCountyData,
  addNCESData,
} from "@/app/scripts/scripts";
import { addFredIds } from "@/utils/fred/utils";
import { addAllACSData, fetchACS } from "@/utils/census/acs/utils";

export default async function Page() {
  async function handleStateData() {
    "use server";
    await addStateData();
  }

  async function handleCountyData() {
    "use server";
    await addCountyData();
  }

  async function handleFredIds() {
    "use server";
    await addFredIds();
  }

  async function handleACSData() {
    "use server";
    await addAllACSData();
  }
  async function handleACSTest() {
    "use server";
    await addNCESData();
  }

  return (
    <div className="m-4 flex flex-col">
      <form action={handleStateData}>
        <button type="submit">Add State Data</button>
      </form>
      <form action={handleCountyData}>
        <button type="submit">Add County Data</button>
      </form>
      <form action={handleFredIds}>
        <button type="submit">Add Fred Ids</button>
      </form>
      <form action={handleACSData}>
        <button type="submit">Add All ACS Data</button>
      </form>
      <form action={handleACSTest}>
        <button type="submit">Test</button>
      </form>
    </div>
  );
}
