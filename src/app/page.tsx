import { env } from "@/env";
import { StateMap } from "./map";
import { getStateGeoJSON } from "@/utils";

export default async function USAPage() {
  const data = await getStateGeoJSON();
  console.log(data);
  return (
    <div>
      <StateMap token={env.MAPBOX_TOKEN} data={data} />
    </div>
  );
}
