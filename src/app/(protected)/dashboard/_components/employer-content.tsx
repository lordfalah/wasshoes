import { SearchParams } from "nuqs";
import React, { Suspense } from "react";
import { SectionCards } from "./section-cards";
import { getAllOrdersForAdmin } from "@/actions/order";
import DataTableOrderEmployer from "./tables/data-table-order-employer";
import { searchParamsCacheOrder } from "@/lib/search-params/search-order";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PrintTablePdf from "./tables/print-table-pdf";
import TablePdfOrdersEmployer from "./tables/table-pdf-order-employer";

type PageProps = {
  searchParams: Promise<SearchParams>;
  storeId?: string | null;
};

const EmployerContent: React.FC<PageProps> = async ({
  searchParams,
  storeId,
}) => {
  if (!storeId) return <div>Chat Owner</div>;

  const search = searchParamsCacheOrder.parse(await searchParams);

  const {
    total,
    data: dataOrders,
    error: errorOrder,
  } = await getAllOrdersForAdmin(search);

  if (!dataOrders || errorOrder) throw new Error(errorOrder);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />

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
            document={<TablePdfOrdersEmployer data={dataOrders} />}
            fileName="laporan-order.pdf"
            className="flex w-0 pb-2 pl-1"
          />
        </Suspense>
        <DataTableOrderEmployer total={total} data={dataOrders} />
      </div>
    </div>
  );
};

export default EmployerContent;
