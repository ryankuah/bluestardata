import Link from "next/link";
import Image from "next/image";

export default async function page({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}) {
  const stateSlug = (await params).state;
  const countySlug = (await params).county;
  const state = decodeURIComponent(stateSlug);
  const county = decodeURIComponent(countySlug);
  return (
    <div>
      <Link href={`/states/${state}/county/${county}/fred`}>
        {" "}
        <Image src="/fred.png" alt="FRED" width={32} height={32} />
      </Link>
    </div>
  );
}
