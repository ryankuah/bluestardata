import FRED from "@/components/fred/fred";

export default async function Page({
  params,
}: {
  params: Promise<{ state: string; msa: string }>;
}) {
  const stateSlug = (await params).state;
  const msaSlug = (await params).msa;
  const state = decodeURIComponent(stateSlug);
  const msa = decodeURIComponent(msaSlug);

  return (
    <div className="m-4 flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold">{msa}</h1>
      </div>
      <FRED state={state} county={msa} />
    </div>
  );
}
