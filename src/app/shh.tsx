"use client";
import { useEffect, useState, Fragment } from "react";
import {
  fetchCategories,
  fetchSeries,
  type Series,
  type Category,
} from "@/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
type BreadcrumbTuple = [string, number];
export default function HomePage() {
  const [breadcrumb, setBreadCrumb] = useState<BreadcrumbTuple[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const getCategories = async (id = 0) => {
    const data = await fetchCategories(id);
    setCategories(data);
  };
  const getSeries = async (id = 0) => {
    const data = await fetchSeries(id);
    setSeries(data);
  };

  const handleClick = async (name: string, id = 0) => {
    setBreadCrumb([...breadcrumb, [name, id]]);
    getCategories(id).catch((err) => console.error(err));
    getSeries(id).catch((err) => console.error(err));
  };

  const handleBreadcrumb = (id: number, index: number) => {
    setBreadCrumb(breadcrumb.slice(0, index + 1));
    getCategories(id).catch((err) => console.error(err));
    getSeries(id).catch((err) => console.error(err));
  };

  useEffect(() => {
    setBreadCrumb([["Home", 0] as BreadcrumbTuple]);
    getCategories().catch((err) => console.error(err));
    getSeries().catch((err) => console.error(err));
  }, []);

  return (
    <div className="flex flex-col">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb.map(([name, id], index) => (
            <Fragment key={id}>
              <BreadcrumbItem>
                <button onClick={() => handleBreadcrumb(id, index)}>
                  {name}
                </button>
              </BreadcrumbItem>
              {index !== breadcrumb.length - 1 && (
                <BreadcrumbSeparator aria-hidden="true" />
              )}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-row">
        <div className="flex h-full w-1/2 flex-col">
          {categories.map((category) => (
            <button
              onClick={() => handleClick(category.name, category.id)}
              key={category.id}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="h-full w-1/2">
          {series.map((series) => (
            <div
              key={series.id}
              className="m-2 rounded-sm border-2 border-black bg-red-200"
            >
              <div>{series.id + series.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
