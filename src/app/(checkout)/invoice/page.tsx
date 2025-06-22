import { getUnpaidOrders } from "@/actions/order";
import InvoiceCard from "@/components/invoice/invoice-card";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { EmptyContent } from "./_components/empty-content";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const InvoicePage: React.FC = async () => {
  const { data: unpaidOrders, error: errorUnpaid } = await getUnpaidOrders();

  if (unpaidOrders === null || typeof errorUnpaid === "string") {
    throw new Error(errorUnpaid);
  }
  return (
    <Shell>
      <div>
        <div className="flex w-full flex-col justify-start gap-6">
          <div className="space-y-5">
            <header className="flex justify-between">
              <PageHeader
                id="invoice-page-header"
                aria-labelledby="invoice-page-header-heading"
              >
                <PageHeaderHeading size="sm">Invoice</PageHeaderHeading>
                <PageHeaderDescription size="sm">
                  Invoice with your cart items
                </PageHeaderDescription>
              </PageHeader>

              <Link
                href={"/invoice/history"}
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant: "outline",
                  }),
                )}
              >
                History Invoice
              </Link>
            </header>

            {unpaidOrders.length > 0 ? (
              unpaidOrders.map(
                (order) =>
                  order && <InvoiceCard key={order.id} order={order} />,
              )
            ) : (
              <EmptyContent text="Your invoice is empty" />
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default InvoicePage;
