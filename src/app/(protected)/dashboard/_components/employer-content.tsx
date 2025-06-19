import { SearchParams } from "nuqs";
import React from "react";
import { SectionCards } from "./section-cards";
import { loadSearchParamsDataDashboardEmployer } from "@/lib/searchParams";
import { getAllOrdersForAdmin } from "@/actions/order";
import { TStatusOrder } from "@prisma/client";
import DataTableOrderEmployer from "./tables/data-table-order-employer";

type PageProps = {
  searchParams: Promise<SearchParams>;
  storeId?: string | null;
};

const EmployerContent: React.FC<PageProps> = async ({
  searchParams,
  storeId,
}) => {
  if (!storeId) return <div>Chat Owner</div>;

  const { page, perPage, sort, status, customer } =
    await loadSearchParamsDataDashboardEmployer(searchParams);

  const { data: dataOrders, error: errorOrder } = await getAllOrdersForAdmin({
    page,
    perPage,
    sort,
    storeId: storeId,
    status: status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as TStatusOrder[],
    nameUser: customer,
  });

  if (!dataOrders || errorOrder) throw new Error(errorOrder);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />

      <div className="px-4 lg:px-6">
        <DataTableOrderEmployer data={dataOrders} />
      </div>
    </div>
  );
};

export default EmployerContent;
