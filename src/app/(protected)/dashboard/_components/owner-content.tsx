import { getAllOrdersForSuperadmin } from "@/actions/order";
import { TError, TSuccess } from "@/types/route-api";
import { Category, Paket, TStatusOrder } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { SearchParams } from "nuqs";
import React from "react";
import { SectionCards } from "./section-cards";
import { ChartAreaInteractive } from "./chart-area-interactive";
import PageTabs from "./page-tabs";
import { TabsContent } from "@/components/ui/tabs";
import DataTableCategorys from "./data-table-category";
import DataTableOrderOwner from "./tables/data-table-order-owner";
import { loadSearchParamsDataDashboardOwner } from "@/lib/searchParams";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const fetchCategorys = async (cookieAuth: ReadonlyRequestCookies) => {
  try {
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/store/category`,
      {
        headers: {
          Cookie: cookieAuth.toString(),
        },
      },
    );
    const res = (await req.json()) as
      | TSuccess<Array<Category & { pakets: Paket[] }>>
      | TError<{
          code?: number;
          description?: string;
        }>;

    if (!res.data) {
      throw new Error(res.message || res.errors.description);
    }

    return res;
  } catch (error) {
    throw error;
  }
};

const OwnerContent: React.FC<PageProps> = async ({ searchParams }) => {
  const cookieStore = await cookies();

  const { customer, page, perPage, sort, status } =
    await loadSearchParamsDataDashboardOwner(searchParams);

  const [{ data: dataCategorys }, { data: dataOrders, error: errorOrder }] =
    await Promise.all([
      fetchCategorys(cookieStore),
      getAllOrdersForSuperadmin({
        page,
        perPage,
        sort,
        customer,
        status: status
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) as TStatusOrder[],
      }),
    ]);

  if (!dataOrders || errorOrder) throw new Error(errorOrder);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      <div className="px-4 lg:px-6">
        <DataTableOrderOwner data={dataOrders} />
      </div>

      <PageTabs className="flex flex-col px-4 lg:px-6">
        <TabsContent value="categorys">
          <DataTableCategorys data={dataCategorys} />
        </TabsContent>

        <TabsContent value="users">Users</TabsContent>
      </PageTabs>
    </div>
  );
};

export default OwnerContent;
