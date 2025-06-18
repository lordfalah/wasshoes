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

  // --- BAGIAN PENTING: Penanganan Status Midtrans dan Fallback (DISEMPURNAKAN) ---
  let currentOrderStatusInDb: TStatusOrder = orderLineItems.order.status; // Status order saat ini di DB
  let statusFromMidtransApi: string | undefined = undefined; // Status mentah dari Midtrans API
  let midtransApiErrorMessage: string | undefined | object = undefined; // Pesan error dari Midtrans API jika gagal

  const {
    data: midtransStatusData,
    error: midtransApiError,
    message: midtransErrorMessage,
  } = await getMidtansStatus(order_id);

  if (midtransStatusData) {
    statusFromMidtransApi = midtransStatusData.transaction_status.toLowerCase();

    // Mapping status Midtrans API ke TStatusOrder lokal
    let mappedStatus: TStatusOrder | undefined;
    if (statusFromMidtransApi === "capture") {
      if (midtransStatusData.fraud_status === "accept") {
        mappedStatus = TStatusOrder.SETTLEMENT;
      }
    } else if (statusFromMidtransApi === "settlement") {
      mappedStatus = TStatusOrder.SETTLEMENT;
    } else if (
      statusFromMidtransApi === "cancel" ||
      statusFromMidtransApi === "deny" ||
      statusFromMidtransApi === "expire"
    ) {
      mappedStatus = TStatusOrder.FAILURE;
    } else if (statusFromMidtransApi === "pending") {
      mappedStatus = TStatusOrder.PENDING;
    } else if (
      statusFromMidtransApi === "refund" ||
      statusFromMidtransApi === "partial_refund"
    ) {
      mappedStatus = TStatusOrder.REFUND; // Tambahkan ini jika ada status REFUND di TStatusOrder Anda
    }

    // Jika ada mappedStatus baru dan berbeda dari status di DB, update DB
    if (mappedStatus && currentOrderStatusInDb !== mappedStatus) {
      console.log(
        `Updating order ${orderLineItems.order.id} status from ${currentOrderStatusInDb} to ${mappedStatus} (from Midtrans API)`,
      );
      await db.order.update({
        where: { id: orderLineItems.order.id },
        data: {
          status: mappedStatus,
        },
      });
      currentOrderStatusInDb = mappedStatus; // Perbarui status lokal untuk rendering
    }
  } else {
    // Jika gagal mengambil dari Midtrans API, gunakan status dari database sebagai sumber kebenaran
    midtransApiErrorMessage =
      midtransApiError ||
      midtransErrorMessage ||
      "Failed to get status from Midtrans API.";
    console.log("Error fetching Midtrans status:", midtransApiErrorMessage);
    // currentOrderStatusInDb sudah diinisialisasi dengan order.status dari DB, jadi tidak perlu diubah
  }

  // --- LOGIKA RENDERING UI BERDASARKAN currentOrderStatusInDb ---
  // Gunakan currentOrderStatusInDb untuk menentukan tampilan
  const isPaymentSuccessful =
    currentOrderStatusInDb === TStatusOrder.SETTLEMENT;
  const isPaymentFailed = currentOrderStatusInDb === TStatusOrder.FAILURE;
  const isPaymentPending = currentOrderStatusInDb === TStatusOrder.PENDING;

  // --- Perhitungan Total ---
  const totalQuantity = orderLineItems.lineItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const subtotalPrice = orderLineItems.lineItems.reduce((acc, item) => {
    // Gunakan harga asli paket dari item.paket.price
    return acc + item.price * item.quantity;
  }, 0);

  // Menggunakan order.totalPrice sebagai harga final
  // Ini adalah harga total yang sudah termasuk penyesuaian jika ada
  const finalPrice = orderLineItems.order.totalPrice;

  // --- LOGIKA DISKON/BIAYA TAMBAHAN ---
  let adjustmentText: string | null = null;
  let adjustmentAmount = 0;

  if (finalPrice > subtotalPrice) {
    adjustmentAmount = finalPrice - subtotalPrice;
    adjustmentText = `Biaya Tambahan: ${formatToRupiah(adjustmentAmount)}`;
  } else if (finalPrice < subtotalPrice) {
    adjustmentAmount = subtotalPrice - finalPrice;
    adjustmentText = `Diskon Biaya: ${formatToRupiah(adjustmentAmount)}`;
  }

  return (
    <div className="flex size-full max-h-dvh flex-col gap-10 overflow-hidden pt-6 pb-8 md:py-8">
      {isPaymentSuccessful ? (
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
            <div className="container w-full max-w-7xl space-y-2">
              <div className="flex items-center">
                <span className="flex-1">Total {totalQuantity}</span>
                <span>
                  {/* Pastikan `price` dan `quantity` adalah number sebelum perhitungan */}
                  {formatToRupiah(subtotalPrice)}
                </span>
              </div>

              {adjustmentText && ( // Hanya render jika ada penyesuaian
                <div className="text-muted-foreground flex w-full items-center justify-between text-sm">
                  <p className="flex-1">{adjustmentText.split(":")[0]}:</p>{" "}
                  {/* Ambil label "Biaya Tambahan" atau "Diskon Biaya" */}
                  <p className="font-medium">
                    {adjustmentText.split(":")[1]}
                  </p>{" "}
                </div>
              )}

              <div className="flex items-center">
                <span className="flex-1">Final</span>
                <span>Rp. {formatToRupiah(finalPrice)}</span>
              </div>
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
        // Bagian untuk status GAGAL, PENDING, atau lainnya
        <div className="container grid max-w-7xl gap-10">
          <Fragment>
            <PageHeader
              id="order-status-page-header"
              aria-labelledby="order-status-page-header-heading"
            >
              <PageHeaderHeading>
                {isPaymentFailed
                  ? `Transaction is ${currentOrderStatusInDb}` // Gagal (CANCEL, EXPIRE, DENY)
                  : isPaymentPending
                    ? `Please complete your order` // Pending
                    : `Transaction status: ${currentOrderStatusInDb || "Unknown"}`}{" "}
                {/* Lainnya atau tidak dikenal */}
              </PageHeaderHeading>
              <PageHeaderDescription>
                <span className="font-semibold">
                  {midtransStatusData ? "Midtrans API Info" : "Fallback Info"}
                </span>
                {midtransApiErrorMessage
                  ? ` - ${midtransApiErrorMessage}`
                  : null}
                {midtransStatusData && midtransStatusData.status_message
                  ? ` - ${midtransStatusData.status_message}`
                  : null}
                {/* Tambahkan pesan relevan lainnya */}
              </PageHeaderDescription>
            </PageHeader>
            <section
              id="order-status-cart-line-items"
              aria-labelledby="order-status-cart-line-items-heading"
              className="flex flex-col space-y-6 overflow-auto"
            >
              {orderLineItems.order ? (
                // Tampilkan CartLineItems atau InvoiceCard berdasarkan konteks
                // Untuk status gagal/pending, mungkin lebih relevan menampilkan InvoiceCard
                // atau ringkasan order
                isPaymentPending ? (
                  <InvoiceCard order={orderLineItems.order} />
                ) : (
                  <CartLineItems
                    items={orderLineItems.lineItems}
                    variant="default"
                    isEditable={false}
                    className="container h-full flex-1"
                  />
                )
              ) : (
                <EmptyContent text="Your order is empty" />
              )}
            </section>
          </Fragment>

          <section
            id="order-status-actions"
            aria-labelledby="order-status-actions-heading"
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
              aria-label="Back to invoice"
              href="/invoice" // Atau ke halaman detail order yang relevan
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "text-center",
                }),
              )}
            >
              View Order Details
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
