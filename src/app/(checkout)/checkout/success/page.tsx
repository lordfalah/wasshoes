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

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Order Success",
  description: "Order summary for your purchase",
};

interface OrderSuccessPageProps {
  searchParams?: Promise<{
    order_id?: string;
    status_code?: string;
    transaction_status?: string;
  }>;
}

export default async function OrderSuccessPage({
  searchParams: searchParamsMidtrans,
}: OrderSuccessPageProps) {
  const searchParams = await searchParamsMidtrans;
  const order_id = searchParams?.order_id || "";
  // const status_code = searchParams?.status_code || "";
  // const transaction_status = searchParams?.transaction_status || "";

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

  return (
    <div className="flex size-full max-h-dvh flex-col gap-10 overflow-hidden pt-6 pb-8 md:py-8">
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

      {/* {isVerified ? (
        <div className="grid gap-10 overflow-auto">
          <PageHeader
            id="order-success-page-header"
            aria-labelledby="order-success-page-header-heading"
            className="container flex max-w-7xl flex-col"
          >
            <PageHeaderHeading>Thank you for your order</PageHeaderHeading>
            <PageHeaderDescription>
              {store?.name ?? "Store"} will be in touch with you shortly
            </PageHeaderDescription>
          </PageHeader>
          <section
            id="order-success-cart-line-items"
            aria-labelledby="order-success-cart-line-items-heading"
            className="flex flex-col space-y-6 overflow-auto"
          >
            <CartLineItems
              items={lineItems}
              isEditable={false}
              className="container max-w-7xl"
            />
            <div className="container flex w-full max-w-7xl items-center">
              <span className="flex-1">
                Total (
                {lineItems.reduce(
                  (acc, item) => acc + Number(item.quantity),
                  0,
                )}
                )
              </span>
              <span>
                {formatToRupiah(
                  lineItems.reduce(
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
            <PageHeaderHeading>Thank you for your order</PageHeaderHeading>
            <PageHeaderDescription>
              Please enter your delivery postal code to verify your order
            </PageHeaderDescription>
          </PageHeader>
          <VerifyOderForm
            id="order-success-verify-order-form"
            aria-labelledby="order-success-verify-order-form-heading"
            className="mx-auto w-full max-w-md pt-40"
          />
        </div>
      )} */}
    </div>
  );
}
