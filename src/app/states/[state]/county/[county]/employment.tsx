import { LabourDoughnut, type DoughnutData } from "./doughnut";
export default async function Labour({
  stateFips,
  countyFips,
}: {
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
}) {
  const labour = (await fetch(
    `https://api.census.gov/data/2022/cbp?get=EMP,ESTAB,NAICS2017_LABEL,NAME&for=county:${countyFips}&in=state:${stateFips}&NAICS2017=*`,
  )
    .then((res) => res.json())
    .catch((err) => console.log(err))) as [number, number, string, string][];
  if (!labour) return <div>No data found</div>;
  const data: DoughnutData[] = [];
  for (const item of labour.slice(2)) {
    if (data.find((thing) => thing.label === item[2])) continue;
    data.push({
      emp: item[0],
      estab: item[1],
      label: item[2],
    });
  }
  data.sort((a, b) => b.emp - a.emp);
  return (
    <div className="flex flex-col">
      <LabourDoughnut doughnutData={data.slice(0, 25)} />
    </div>
  );
}
