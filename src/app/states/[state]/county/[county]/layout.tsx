export default async function Page({
  params,
  children,
}: {
  params: Promise<{ state: string; county: string }>;
  children: React.ReactNode;
}) {
  const countySlug = (await params).county;
  const county = decodeURIComponent(countySlug);

  return (
    <div className="m-4 flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold">{county}</h1>
      </div>
      <div className="flex h-full w-full flex-col">{children}</div>
    </div>
  );
}
