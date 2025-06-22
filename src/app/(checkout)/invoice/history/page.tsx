import { getHistoryOrder } from "@/actions/order";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { EmptyContent } from "../_components/empty-content";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import HistoryOrderCard from "./_components/history-card";

const InvoiceHistoryPage: React.FC = async () => {
  const { data: historyOrders, error: errorHistory } = await getHistoryOrder();

  if (historyOrders === null || typeof errorHistory === "string") {
    throw new Error(errorHistory);
  }

  return (
    <Shell>
      <div>
        <div
          defaultValue="Invoice"
          className="flex w-full flex-col justify-start gap-6"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <PageHeader
                id="invoice-page-header"
                aria-labelledby="invoice-page-header-heading"
              >
                <PageHeaderHeading size="sm">History Invoice</PageHeaderHeading>
                <PageHeaderDescription size="sm">
                  Invoice with your cart items
                </PageHeaderDescription>
              </PageHeader>

              <Link
                href={"/invoice"}
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant: "outline",
                  }),
                )}
              >
                Invoice
              </Link>
            </div>

            {historyOrders.length > 0 ? (
              historyOrders.map(
                (order) =>
                  order && <HistoryOrderCard key={order.id} order={order} />,
              )
            ) : (
              <EmptyContent text="Your history order is empty" />
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default InvoiceHistoryPage;
