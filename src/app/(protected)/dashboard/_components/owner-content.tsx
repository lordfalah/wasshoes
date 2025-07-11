import { getAllOrdersForSuperadmin } from "@/actions/order";
import { TError, TSuccess } from "@/types/route-api";
import { Category, Paket } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { SearchParams } from "nuqs";
import React, { Suspense } from "react";
import { SectionCards } from "./section-cards";
import { ChartAreaInteractive } from "./chart-area-interactive";
import PageTabs from "./page-tabs";
import { TabsContent } from "@/components/ui/tabs";
import DataTableCategorys from "./data-table-category";
import DataTableOrderOwner from "./tables/data-table-order-owner";
import { searchParamsCacheOrder } from "@/lib/search-params/search-order";
import PrintTablePdf from "./tables/print-table-pdf";
import TablePdfOrderOwner from "./tables/table-pdf-order-owner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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

  const search = searchParamsCacheOrder.parse(await searchParams);

  const [
    { data: dataCategorys },
    { data: dataOrders, total, error: errorOrder },
  ] = await Promise.all([
    fetchCategorys(cookieStore),
    getAllOrdersForSuperadmin(search),
  ]);

  if (!dataOrders || errorOrder) throw new Error(errorOrder);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      <div className="px-4 lg:px-6">
        <Suspense
          key={dataOrders.length}
          fallback={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center justify-between"
              disabled={true}
            >
              <Loader2 className="animate-spin" />
              Please wait
            </Button>
          }
        >
          <PrintTablePdf
            document={<TablePdfOrderOwner data={dataOrders} />}
            fileName="laporan-order.pdf"
            className="flex w-0 pb-2 pl-1"
          />
        </Suspense>
        <DataTableOrderOwner data={dataOrders} total={total} />
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
