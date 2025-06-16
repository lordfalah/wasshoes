import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

import { cn, formatToRupiah } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { getStoreByStoreId } from "@/actions/store";
import { Category, Order, Paket, PaketOrder } from "@prisma/client";
import { InvoiceLineItems } from "./cart-line-items";
import ShiftingCountdown from "../shifting-countdown";
import ButtonPayTransaction from "./pay-transaction";
import BtnCancelTransaction from "./btn-submit-load";
import { cancelTransactionOrder } from "@/actions/order";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { redirect } from "next/navigation";
import { getMidtansStatus } from "@/actions/midtrans-status";

interface InvoiceCardProps {
  redirectUrl?: string;
  order: Order & {
    pakets: Array<
      PaketOrder & { paket: Paket & { category: Category | null } }
    >;
  };
}

const InvoiceCard: React.FC<InvoiceCardProps> = async ({
  order,
  redirectUrl,
}) => {
  const { data: storeData, error } = await getStoreByStoreId(order.storeId);
  if (!storeData) throw new Error(error ?? "Error getStoreByStoreId");

  const { data: midtransStatusData } = await getMidtansStatus(order.id);

  const onCancelTransaction = async () => {
    "use server";

    try {
      const { error } = await cancelTransactionOrder(order.id);
      if (error) throw new Error(error);
      if (redirectUrl) redirect(redirectUrl);
    } catch (error) {
      throw error;
    }
  };

  // --- Perhitungan Total ---
  const totalQuantity = order.pakets.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const subtotalPrice = order.pakets.reduce((acc, item) => {
    // Gunakan harga asli paket dari item.paket.price
    return acc + item.paket.price * item.quantity;
  }, 0);

  // Menggunakan order.totalPrice sebagai harga final
  // Ini adalah harga total yang sudah termasuk penyesuaian jika ada
  const finalPrice = order.totalPrice;

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
    <Card
      key={order.storeId}
      as="section"
      id={`checkout-store-${order.storeId}`}
      aria-labelledby={`checkout-store-${order.storeId}-heading`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-x-4 py-4">
        <CardTitle className="line-clamp-1">{storeData.name}</CardTitle>

        <ShiftingCountdown
          className="hidden sm:block"
          createdAt={order.createdAt}
          title={
            midtransStatusData
              ? `Selesaikan Pembayaran ${midtransStatusData.payment_type} Dalam Tempo`
              : "Selesaikan Dalam Tempo"
          }
        />

        {order.paymentToken ? (
          <div className="flex flex-wrap gap-2">
            <ButtonPayTransaction paymentToken={order.paymentToken} />
            {midtransStatusData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <form action={onCancelTransaction}>
                    <BtnCancelTransaction />
                  </form>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          "Token Required"
        )}
      </CardHeader>
      <Separator className="mb-4" />
      <CardContent className="space-y-1.5">
        <ShiftingCountdown
          className="block sm:hidden"
          createdAt={order.createdAt}
          title={
            midtransStatusData
              ? `Selesaikan Pembayaran ${midtransStatusData.payment_type} Dalam Tempo`
              : "Selesaikan Dalam Tempo"
          }
        />
        <InvoiceLineItems
          isEditable={false}
          items={order.pakets}
          className="max-h-[280px] !px-0 sm:!px-6"
        />
      </CardContent>
      <Separator className="mb-4" />
      <CardFooter className="flex-col justify-between space-y-2">
        {" "}
        {/* Tambahkan space-y-2 untuk jarak antar baris */}
        {/* Baris untuk Subtotal (Total Harga Barang Asli) */}
        <div className="flex w-full items-center justify-between">
          <p>Subtotal ({totalQuantity}) </p>
          <p>{formatToRupiah(subtotalPrice)}</p>
        </div>
        {/* Baris untuk Biaya Tambahan / Diskon Biaya (jika ada) */}
        {adjustmentText && ( // Hanya render jika ada penyesuaian
          <div className="flex w-full items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {adjustmentText.split(":")[0]}:
            </p>{" "}
            {/* Ambil label "Biaya Tambahan" atau "Diskon Biaya" */}
            <p
              className={cn(
                "font-medium",
                finalPrice > subtotalPrice
                  ? "text-destructive"
                  : "text-emerald-500",
              )}
            >
              {adjustmentText.split(":")[1]}
            </p>{" "}
            {/* Ambil nilai yang sudah diformat */}
          </div>
        )}
        {/* Baris untuk Harga Final */}
        <div className="flex w-full items-center justify-between font-semibold">
          <p>Total</p>
          <p>{formatToRupiah(finalPrice)}</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InvoiceCard;
