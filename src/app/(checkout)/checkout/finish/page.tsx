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
import { TStatusOrder } from "@prisma/client";
import { getMidtansStatus } from "@/actions/midtrans-status";
import { EmptyContent } from "../../invoice/_components/empty-content";
import { Fragment } from "react";
import InvoiceCard from "@/components/invoice/invoice-card";

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Order Success",
  description: "Order summary for your purchase",
};

interface FinishCheckoutPageProps {
  searchParams?: Promise<{
    order_id?: string;
    status_code?: string;
    transaction_status?: string;
  }>;
}

export default async function FinishCheckoutPage({
  searchParams: searchParamsMidtrans,
}: FinishCheckoutPageProps) {
  const searchParams = await searchParamsMidtrans;
  const order_id = searchParams?.order_id || "";

  if (!order_id) throw Error("Order id is required!");

  const { data: orderLineItems, error: errorLineItems } =
    await getOrderLineItems({ orderId: order_id });

  if (!orderLineItems || errorLineItems) {
    throw new Error(errorLineItems);
  }

  const store = await db.store.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: orderLineItems.storeId,
    },
  });

  if (!store) {
    notFound();
  }

  // --- BAGIAN PENTING: Penanganan Status Midtrans dan Fallback ---
  let transactionStatus: string;

  const {
    data: midtransStatusData,
    error: midtransApiError,
    message: midtransErrorMessage,
  } = await getMidtansStatus(order_id);

  if (midtransStatusData) {
    transactionStatus = midtransStatusData.transaction_status.toUpperCase();
  } else {
    console.log(
      "Error fetching Midtrans status:",
      midtransApiError || midtransErrorMessage,
    );

    // Gunakan status dari order di database sebagai fallback
    transactionStatus = orderLineItems.order.status.toUpperCase();
  }

  console.log({ midtransStatusData, transactionStatus });

  return (
    <div className="flex size-full max-h-dvh flex-col gap-10 overflow-hidden pt-6 pb-8 md:py-8">
      {(midtransStatusData && transactionStatus === TStatusOrder.SETTLEMENT) ||
      (transactionStatus === TStatusOrder.CAPTURE &&
        midtransStatusData?.fraud_status === "accept") ? (
        <div className="grid gap-10 overflow-auto">
          <PageHeader
            id="order-success-page-header"
            aria-labelledby="order-success-page-header-heading"
            className="container flex max-w-7xl flex-col"
          >
            <PageHeaderHeading>Thank you for your order</PageHeaderHeading>
            <PageHeaderDescription>
              {store.name ?? "Store"} will be in touch with you shortly
            </PageHeaderDescription>
          </PageHeader>
          <section
            id="order-success-cart-line-items"
            aria-labelledby="order-success-cart-line-items-heading"
            className="flex flex-col space-y-6 overflow-auto"
          >
            <CartLineItems
              items={orderLineItems.lineItems}
              isEditable={false}
              className="container max-w-7xl"
            />
            <div className="container flex w-full max-w-7xl items-center">
              <span className="flex-1">
                Total (
                {orderLineItems.lineItems.reduce(
                  (acc, item) => acc + Number(item.quantity),
                  0,
                )}
                )
              </span>
              <span>
                Rp.{" "}
                {formatToRupiah(
                  orderLineItems.lineItems.reduce(
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
          {transactionStatus === TStatusOrder.CANCEL ||
          transactionStatus === TStatusOrder.EXPIRE ||
          transactionStatus === TStatusOrder.DENY ? (
            <Fragment>
              <PageHeader
                id="order-failed-page-header"
                aria-labelledby="order-failed-page-header-heading"
              >
                <PageHeaderHeading>
                  Transaction is {transactionStatus}
                </PageHeaderHeading>
                <PageHeaderDescription>
                  <span className="font-semibold">Fallback</span>-
                  {typeof midtransErrorMessage === "object"
                    ? JSON.stringify(midtransErrorMessage)
                    : midtransErrorMessage.toString()}
                </PageHeaderDescription>
              </PageHeader>
              <section
                id="order-failed-cart-line-items"
                aria-labelledby="order-failed-cart-line-items-heading"
                className="flex flex-col space-y-6 overflow-auto"
              >
                {orderLineItems.order ? (
                  <CartLineItems
                    items={orderLineItems.lineItems}
                    variant="default"
                    isEditable={false}
                    className="container h-full flex-1"
                  />
                ) : (
                  <EmptyContent text="Your order is empty" />
                )}
              </section>
            </Fragment>
          ) : (
            <Fragment>
              <PageHeader
                id="order-success-page-header"
                aria-labelledby="order-success-page-header-heading"
              >
                <PageHeaderHeading>
                  Please completed your order
                </PageHeaderHeading>
                <PageHeaderDescription>
                  <span className="font-semibold">Fallback</span>-
                  {typeof midtransErrorMessage === "object"
                    ? JSON.stringify(midtransErrorMessage)
                    : midtransErrorMessage.toString()}
                </PageHeaderDescription>
              </PageHeader>

              <section
                id="order-pending-cart-line-items"
                aria-labelledby="order-pending-cart-line-items-heading"
                className="flex flex-col space-y-6 overflow-auto"
              >
                {orderLineItems.order ? (
                  <InvoiceCard order={orderLineItems.order} />
                ) : (
                  <EmptyContent text="Your order is empty" />
                )}
              </section>
            </Fragment>
          )}

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
