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
  userId: string;
}

export async function CheckoutCard({ storeId, userId }: CheckoutCardProps) {
  const cartLineItems = await getCart({ storeId });

  let redirectUrl = `/checkout/${storeId}`;

  if (!userId) throw new Error("Id user required");

  if (userId) {
    const { data, error } = await getUnpaidOrderByStore(userId, storeId);
    if (data !== null) {
      redirectUrl = `/invoice`;
    }

    if (error) throw new Error(error);
  }

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
      <CardFooter className="space-x-4">
        <span className="flex-1">
          Total ({cartLineItems.reduce((acc, item) => acc + item.quantity, 0)})
        </span>
        <span>
          {formatToRupiah(
            cartLineItems.reduce(
              (acc, item) => acc + Number(item.price) * item.quantity,
              0,
            ),
          )}
        </span>
      </CardFooter>
    </Card>
  );
}
