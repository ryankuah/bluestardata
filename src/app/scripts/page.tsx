import {
  addStateData,
  addCountyData,
  addNCESPublicData,
  addNCESPrivateData,
  exportFredCountiesCSV,
  importFredCountyIds,
  exportFredStatesToCSV,
  importFredStateIds,
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
  async function handleNCESPublic() {
    "use server";
    await addNCESPublicData();
  }

  async function handleNCESPrivate() {
    "use server";
    await addNCESPrivateData();
  }

  async function handleExportFredCounties() {
    "use server";
    const result = await exportFredCountiesCSV();
    console.log(result);
  }

  async function handleImportFredCountyIds() {
    "use server";
    const result = await importFredCountyIds();
    console.log(result);
  }

  async function handleExportFredStates() {
    "use server";
    const result = await exportFredStatesToCSV();
    console.log(result);
  }

  async function handleImportFredStateIds() {
    "use server";
    const result = await importFredStateIds();
    console.log(result);
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
      <form action={handleNCESPublic}>
        <button type="submit">Add All NCES Public School Data</button>
      </form>
      <form action={handleNCESPrivate}>
        <button type="submit">Add All NCES Private School Data</button>
      </form>
      <form action={handleExportFredCounties}>
        <button type="submit">Export FRED Counties to CSV</button>
      </form>
      <form action={handleImportFredCountyIds}>
        <button type="submit">Import FRED County IDs to Database</button>
      </form>
      <form action={handleExportFredStates}>
        <button type="submit">Export FRED States to CSV</button>
      </form>
      <form action={handleImportFredStateIds}>
        <button type="submit">Import FRED State IDs to Database</button>
      </form>
    </div>
  );
}
