import Link from "next/link";
import { cn, formatToRupiah } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartLineItems } from "@/components/checkout/cart-line-items";
import { getCart } from "@/actions/cart";
import { getUnpaidOrderByStore } from "@/actions/order";

interface CheckoutCardProps {
  storeId: string;
}

export async function CheckoutCard({ storeId }: CheckoutCardProps) {
  const cartLineItems = await getCart({ storeId });

  let redirectUrl = `/checkout/${storeId}`;
  const { data, error } = await getUnpaidOrderByStore(storeId);
  if (data !== null) {
    redirectUrl = `/invoice`;
  }

  if (error) throw new Error(error);

  // --- Perhitungan Total yang Didefinisikan di Awal ---
  const totalQuantity = cartLineItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const subtotalPrice = cartLineItems.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const finalPrice = cartLineItems.reduce((acc, item) => {
    // Jika item.priceOrder ada dan bukan null/undefined, gunakan itu.
    // Jika tidak, gunakan item.price * item.quantity.
    return (
      acc +
      (item.priceOrder !== undefined && item.priceOrder !== null
        ? item.priceOrder
        : item.price * item.quantity)
    );
  }, 0);

  // --- LOGIKA DISKON/BIAYA TAMBAHAN BARU DI SINI ---
  let adjustmentText: string | null = null;
  let adjustmentAmount = 0;

  if (finalPrice > subtotalPrice) {
    adjustmentAmount = finalPrice - subtotalPrice;
    adjustmentText = `Biaya Tambahan: ${formatToRupiah(adjustmentAmount)}`;
  } else if (finalPrice < subtotalPrice) {
    adjustmentAmount = subtotalPrice - finalPrice;
    adjustmentText = `Diskon Biaya: ${formatToRupiah(adjustmentAmount)}`;
  }
  // Tidak perlu else jika finalPrice === subtotalPrice, karena tidak ada penyesuaian

  return (
    <Card
      key={storeId}
      as="section"
      id={`checkout-store-${storeId}`}
      aria-labelledby={`checkout-store-${storeId}-heading`}
    >
      <CardHeader className="flex flex-row items-center space-x-4 py-4">
        <CardTitle className="line-clamp-1 flex-1">
          {cartLineItems[0].stores.find(({ id }) => id === storeId)?.name}
        </CardTitle>
        <Link
          aria-label="Checkout"
          href={redirectUrl}
          className={cn(
            buttonVariants({
              size: "sm",
            }),
          )}
        >
          {redirectUrl.includes("/invoice")
            ? "Selesaikan Pembayaran Terlebih dahulu!"
            : "Checkout"}
        </Link>
      </CardHeader>
      <Separator className="mb-4" />
      <CardContent className="pr-0 pb-6 pl-6">
        <CartLineItems items={cartLineItems} className="max-h-[280px]" />
      </CardContent>
      <Separator className="mb-4" />
      <CardFooter className="flex-col justify-between space-y-2">
        {" "}
        {/* Tambahkan space-y-2 untuk jarak antar baris */}
        {/* Baris untuk Subtotal (Total Harga Barang Asli) */}
        <div className="flex w-full items-center justify-between">
          <p>
            Subtotal ({totalQuantity}){" "}
            {/* Menggunakan totalQuantity yang sudah dihitung */}
          </p>
          <p>{formatToRupiah(subtotalPrice)}</p>
        </div>
        {/* Baris untuk Biaya Tambahan / Diskon Biaya (jika ada) */}
        {adjustmentText && ( // Hanya render jika ada penyesuaian
          <div className="text-muted-foreground flex w-full items-center justify-between text-sm">
            <p>{adjustmentText.split(":")[0]}:</p>{" "}
            {/* Ambil label "Biaya Tambahan" atau "Diskon Biaya" */}
            <p className="font-medium">{adjustmentText.split(":")[1]}</p>{" "}
            {/* Ambil nilai yang sudah diformat */}
          </div>
        )}
        {/* Baris untuk Harga Final */}
        <div className="flex w-full items-center justify-between font-semibold">
          {" "}
          {/* Tambahkan font-semibold untuk menonjolkan Harga Final */}
          <p>Total</p>
          <p>{formatToRupiah(finalPrice)}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
