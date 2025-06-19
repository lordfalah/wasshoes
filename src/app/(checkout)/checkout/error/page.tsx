import type { Metadata } from "next";
import Link from "next/link";
import { cn, formatToRupiah } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CartLineItems } from "@/components/checkout/cart-line-items";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { db } from "@/lib/db";
import { getOrderLineItems } from "@/actions/order";
import { notFound } from "next/navigation";
import { getMidtransStatus } from "@/actions/midtrans-status";

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Order Error",
  description: "Order summary for your purchase",
};

interface FinishCheckoutPageProps {
  searchParams?: Promise<{
    order_id?: string;
  }>;
}

export default async function FinishCheckoutPage({
  searchParams: searchParamsMidtrans,
}: FinishCheckoutPageProps) {
  const searchParams = await searchParamsMidtrans;
  const order_id = searchParams?.order_id || "";

  if (!order_id) throw Error("Order id is required!");

  const { data, error } = await getOrderLineItems({ orderId: order_id });
  if (!data || error) throw new Error(error);

  const store = await db.store.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: data.storeId,
    },
  });

  if (!store) {
    notFound();
  }

  let transactionStatus: string;

  const {
    data: midtransStatusData,
    error: midtransApiError,
    message: midtransErrorMessage,
  } = await getMidtransStatus(order_id);

  if (midtransStatusData) {
    transactionStatus = midtransStatusData.transaction_status.toUpperCase();
  } else {
    console.log(
      "Error fetching Midtrans status:",
      midtransApiError || midtransErrorMessage,
    );

    // Gunakan status dari order di database sebagai fallback
    transactionStatus = data.order.status.toUpperCase();
  }

  return (
    <div className="flex size-full max-h-dvh flex-col gap-10 overflow-hidden pt-6 pb-8 md:py-8">
      {midtransStatusData ? (
        <div className="grid gap-10 overflow-auto">
          <PageHeader
            id="order-success-page-header"
            aria-labelledby="order-success-page-header-heading"
            className="container flex max-w-7xl flex-col"
          >
            <PageHeaderHeading>
              Sory you order is {transactionStatus}
            </PageHeaderHeading>
            <PageHeaderDescription>
              <span className="font-semibold">Midtrans</span>-
              {typeof midtransErrorMessage === "string" && midtransErrorMessage}
            </PageHeaderDescription>
          </PageHeader>
          <section
            id="order-success-cart-line-items"
            aria-labelledby="order-success-cart-line-items-heading"
            className="flex flex-col space-y-6 overflow-auto"
          >
            <CartLineItems
              items={data.lineItems}
              isEditable={false}
              className="container max-w-7xl"
            />
            <div className="container flex w-full max-w-7xl items-center">
              <span className="flex-1">
                Total (
                {data.lineItems.reduce(
                  (acc, item) => acc + Number(item.quantity),
                  0,
                )}
                )
              </span>
              <span>
                Rp.{" "}
                {formatToRupiah(
                  data.lineItems.reduce(
                    (acc, item) =>
                      acc + Number(item.price) * Number(item.quantity),
                    0,
                  ),
                )}
              </span>
            </div>
          </section>
          <section
            id="order-success-actions"
            aria-labelledby="order-success-actions-heading"
            className="container flex max-w-7xl items-center justify-center space-x-2.5"
          >
            <Link
              aria-label="Continue shopping"
              href="/products"
              className={cn(
                buttonVariants({
                  size: "sm",
                  className: "text-center",
                }),
              )}
            >
              Continue shopping
            </Link>
            <Link
              aria-label="Back to cart"
              href="/cart"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "text-center",
                }),
              )}
            >
              Back to cart
            </Link>
          </section>
        </div>
      ) : (
        <div className="container grid max-w-7xl gap-10">
          <PageHeader
            id="order-success-page-header"
            aria-labelledby="order-success-page-header-heading"
          >
            <PageHeaderHeading>
              Sory you order is {transactionStatus}
            </PageHeaderHeading>
            <PageHeaderDescription>
              <span className="font-semibold">Fallback</span>-
              {typeof midtransErrorMessage === "object"
                ? JSON.stringify(midtransErrorMessage)
                : midtransErrorMessage.toString()}
            </PageHeaderDescription>
          </PageHeader>

          <section
            id="order-success-cart-line-items"
            aria-labelledby="order-success-cart-line-items-heading"
            className="flex flex-col space-y-6 overflow-auto"
          >
            <CartLineItems
              items={data.lineItems}
              isEditable={false}
              className="container max-w-7xl"
            />
            <div className="container flex w-full max-w-7xl items-center">
              <span className="flex-1">
                Total (
                {data.lineItems.reduce(
                  (acc, item) => acc + Number(item.quantity),
                  0,
                )}
                )
              </span>
              <span>
                Rp.{" "}
                {formatToRupiah(
                  data.lineItems.reduce(
                    (acc, item) =>
                      acc + Number(item.price) * Number(item.quantity),
                    0,
                  ),
                )}
              </span>
            </div>
          </section>
          <section
            id="order-success-actions"
            aria-labelledby="order-success-actions-heading"
            className="container flex max-w-7xl items-center justify-center space-x-2.5"
          >
            <Link
              aria-label="Continue shopping"
              href="/products"
              className={cn(
                buttonVariants({
                  size: "sm",
                  className: "text-center",
                }),
              )}
            >
              Continue shopping
            </Link>
            <Link
              aria-label="Back to cart"
              href="/invoice"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "text-center",
                }),
              )}
            >
              Back to invoice
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
