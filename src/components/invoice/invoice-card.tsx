import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { calculateOrderTotals, cn, formatToRupiah } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { getStoreByStoreId } from "@/actions/store";
import {
  Category,
  Order,
  Paket,
  PaketOrder,
  TPaymentMethod,
  TStatusOrder,
} from "@prisma/client";
import { InvoiceLineItems } from "./cart-line-items";
import ShiftingCountdown from "../shifting-countdown";
import ButtonPayTransaction from "./pay-transaction";
import { cancelTransactionOrder, updateStatusOrder } from "@/actions/order";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { redirect } from "next/navigation";
import { getMidtransStatus } from "@/actions/midtrans-status";
import BtnSubmitWithLoad from "./btn-submit-load";

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

  const { data: midtransStatusData } = await getMidtransStatus(order.id);

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

  const onTransactionManual = async (statusOrder: TStatusOrder) => {
    "use server";

    try {
      const { data, error } = await updateStatusOrder({
        orderId: order.id,
        statusOrder,
      });
      if (!data || error) throw new Error(error);

      redirect("/invoice/history");
    } catch (error) {
      throw error;
    }
  };

  // --- PREPARASI DATA UNTUK calculateOrderTotals ---
  // Kita perlu mengubah `order.pakets` menjadi format `ItemPriceDetails[]`
  // yang diharapkan oleh `calculateOrderTotals`.
  const itemsForCalculation = order.pakets.map((paketOrder) => {
    return {
      price: paketOrder.paket.price,
      quantity: paketOrder.quantity,
      priceOrder: paketOrder.priceOrder,
    };
  });

  const { totalQuantity, subtotalPrice, finalPrice, adjustmentText } =
    calculateOrderTotals(itemsForCalculation);

  // console.log({ totalQuantity, subtotalPrice, finalPrice, adjustmentText });

  return (
    <Card
      key={order.storeId}
      as="section"
      id={`checkout-store-${order.storeId}`}
      aria-labelledby={`checkout-store-${order.storeId}-heading`}
    >
      <CardHeader className="flex flex-col items-center justify-between space-x-4 gap-y-2 py-4 sm:flex-row">
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

        {order.paymentToken && order.paymentMethod === TPaymentMethod.AUTO ? (
          <div className="flex gap-2">
            <ButtonPayTransaction paymentToken={order.paymentToken} />
            {midtransStatusData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <form action={onCancelTransaction}>
                    <BtnSubmitWithLoad />
                  </form>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <form
                  action={onTransactionManual.bind(
                    null,
                    TStatusOrder.SETTLEMENT,
                  )}
                >
                  <BtnSubmitWithLoad iconName="HandCoins" />
                </form>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pay</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <form
                  action={onTransactionManual.bind(null, TStatusOrder.CANCEL)}
                >
                  <BtnSubmitWithLoad />
                </form>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancel</p>
              </TooltipContent>
            </Tooltip>
          </div>
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
        <Separator className="my-4 block w-full sm:hidden" />
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
          <p>Rp. {formatToRupiah(subtotalPrice)}</p>
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
          <p>Rp. {formatToRupiah(finalPrice)}</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InvoiceCard;
