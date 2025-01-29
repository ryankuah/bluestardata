import { addStateData, addCountyData } from "@/app/scripts/scripts";
import { addFredIds } from "@/utils/fred/utils";
export default async function Page() {
  async function handleStateData() {
    'use server'
    await addStateData();
  }

  async function handleCountyData() {
    'use server'
    await addCountyData();
  }

  async function handleFredIds() {
    'use server'
    await addFredIds();
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
    </div>
  );
}