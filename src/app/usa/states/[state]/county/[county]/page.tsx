import FRED from "@/components/fred/fred";

export default async function Page({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}) {
  const stateSlug = (await params).state;
  const countySlug = (await params).county;
  const state = decodeURIComponent(stateSlug);
  const county = decodeURIComponent(countySlug);

  return (
    <div className="m-4 flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold">{county}</h1>
      </div>
      <FRED state={state} county={county} />
    </div>
  );
}
