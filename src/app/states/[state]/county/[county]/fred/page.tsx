import FRED from "@/components/fred/fred";
import Link from "next/link";

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
    <div className="flex flex-col">
      <Link
        className="brder-gray-500 h-max w-max cursor-pointer rounded-md border bg-gray-400 px-2 py-1"
        href={`/states/${state}/county/${county}`}
      >
        Back
      </Link>
      <FRED state={state} county={county} />
    </div>
  );
}
