import { getStateGeoJSON, getToken, getAllCountyData } from "@/utils/map/utils";
import { MainMap } from "./mainmap";

export default async function Page() {
  const stateGeoJSON = await getStateGeoJSON();
  const token = await getToken();
  const countyData = await getAllCountyData();
  return (
    <MainMap token={token} state={stateGeoJSON} allCounties={countyData} />
  );
}

