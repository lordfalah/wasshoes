import { getHistoryOrder, getUnpaidOrders } from "@/actions/order";
import { Icons } from "@/components/icons";
import InvoiceCard from "@/components/invoice/invoice-card";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import Link from "next/link";
import HistoryOrderCard from "./_components/history-card";

const viewContent = ["Invoice", "History"] as const;

const InvoicePage: React.FC = async () => {
  const [unpaidOrders, historyOrders] = await Promise.all([
    getUnpaidOrders(),
    getHistoryOrder(),
  ]);

  return (
    <Shell>
      <div>
        <Tabs
          defaultValue="Invoice"
          className="flex w-full flex-col justify-start gap-6"
        >
          <TabsContent value="Invoice" className="space-y-5">
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

              <TabsList className="flex">
                {viewContent.map((value, idx) => (
                  <TabsTrigger value={value} key={`${value}-${idx}`}>
                    {value}
                  </TabsTrigger>
                ))}
              </TabsList>
            </header>

            {unpaidOrders ? (
              unpaidOrders.map(
                (order) =>
                  order && <InvoiceCard key={order.id} order={order} />,
              )
            ) : (
              <EmptyContent text="Your invoice is empty" />
            )}
          </TabsContent>

          <TabsContent value="History" className="space-y-5">
            <header className="flex justify-between">
              <PageHeader
                id="history-page-header"
                aria-labelledby="history-page-header-heading"
              >
                <PageHeaderHeading size="sm">History</PageHeaderHeading>
                <PageHeaderDescription size="sm">
                  History with your cart items
                </PageHeaderDescription>
              </PageHeader>

              <TabsList className="flex">
                {viewContent.map((value, idx) => (
                  <TabsTrigger value={value} key={`${value}-${idx}`}>
                    {value}
                  </TabsTrigger>
                ))}
              </TabsList>
            </header>

            {historyOrders ? (
              historyOrders.map(
                (order) =>
                  order && <HistoryOrderCard key={order.id} order={order} />,
              )
            ) : (
              <EmptyContent text="Your history order is empty" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

const EmptyContent: React.FC<{ text: string }> = ({ text }) => {
  return (
    <section
      id={`empty-content`}
      aria-labelledby="empty-content-heading"
      className="flex h-full flex-col items-center justify-center space-y-1 pt-16"
    >
      <Icons.cart
        className="text-muted-foreground mb-4 size-16"
        aria-hidden="true"
      />
      <div className="text-muted-foreground text-xl font-medium">{text}</div>
      <Link
        aria-label="Add items to your cart to checkout"
        href="/products"
        className={cn(
          buttonVariants({
            variant: "link",
            size: "sm",
            className: "text-muted-foreground text-sm",
          }),
        )}
      >
        Add items your cart to checkout
      </Link>
    </section>
  );
};

export default InvoicePage;
