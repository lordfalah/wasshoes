import Link from "next/link";

import { cn, formatToRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartLineItems } from "@/components/checkout/cart-line-items";
import { Icons } from "@/components/icons";
import { getCart } from "@/actions/cart";

export async function CartSheet() {
  const cartLineItems = await getCart();

  const itemCount = cartLineItems.reduce(
    (total, item) => total + Number(item.quantity),
    0,
  );

  const cartTotal = cartLineItems.reduce(
    (total, item) => total + item.quantity * Number(item.price),
    0,
  );

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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label="Open cart"
          variant="outline"
          size="icon"
          className="relative"
        >
          {itemCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 size-6 justify-center rounded-full p-2.5"
            >
              {itemCount}
            </Badge>
          )}
          <Icons.cart className="size-4" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle>Cart {itemCount > 0 && `(${itemCount})`}</SheetTitle>
          <Separator />
        </SheetHeader>
        {itemCount > 0 ? (
          <>
            <CartLineItems items={cartLineItems} className="flex-1" />
            <div className="space-y-4 px-6">
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex">
                  <span className="flex-1">Subtotal ({totalQuantity}) </span>
                  <span>{formatToRupiah(subtotalPrice)}</span>
                </div>

                {adjustmentText && ( // Hanya render jika ada penyesuaian
                  <div className="text-muted-foreground flex w-full text-sm">
                    <span className="flex-1">
                      {adjustmentText.split(":")[0]}:
                    </span>{" "}
                    {/* Ambil label "Biaya Tambahan" atau "Diskon Biaya" */}
                    <span className="font-medium">
                      {adjustmentText.split(":")[1]}
                    </span>{" "}
                    {/* Ambil nilai yang sudah diformat */}
                  </div>
                )}

                <div className="flex">
                  <span className="flex-1">Total</span>
                  <span>Rp. {formatToRupiah(cartTotal)}</span>
                </div>
              </div>
              <SheetFooter>
                <SheetTrigger asChild>
                  <Link
                    aria-label="View your cart"
                    href="/cart"
                    className={buttonVariants({
                      size: "sm",
                      className: "w-full",
                    })}
                  >
                    Continue to checkout
                  </Link>
                </SheetTrigger>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-1">
            <Icons.cart
              className="text-muted-foreground mb-4 size-16"
              aria-hidden="true"
            />
            <div className="text-muted-foreground text-xl font-medium">
              Your cart is empty
            </div>
            <SheetTrigger asChild>
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
                Add items to your cart to checkout
              </Link>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
