import data from "./data.json";
import { SectionCards } from "./_components/section-cards";
import { ChartAreaInteractive } from "./_components/chart-area-interactive";
import { DataTable } from "./_components/data-table";
import { cookies } from "next/headers";
import { TError, TSuccess } from "@/types/route-api";
import { Category, Paket } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import DataTableCategorys from "./_components/data-table-category";
import { TabsContent } from "@/components/ui/tabs";

import PageTabs from "./_components/page-tabs";

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

export default async function PageDashboard() {
  const cookieStore = await cookies();

  const { data: dataCategorys } = await fetchCategorys(cookieStore);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />

      <PageTabs className="flex flex-col px-4 lg:px-6">
        <TabsContent value="categorys">
          <DataTableCategorys data={dataCategorys} />
        </TabsContent>

        <TabsContent value="users">Users</TabsContent>
      </PageTabs>
    </div>
  );
}
