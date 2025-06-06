import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { getUniqueStoreIds } from "@/actions/cart";
import { CheckoutCard } from "@/components/checkout/checkout-card";
import { auth } from "@/auth";

export const metadata: Metadata = {
  metadataBase: new URL(String(process.env.NEXT_PUBLIC_APP_URL)),
  title: "Cart",
  description: "Checkout with your cart items",
};

export default async function CartPage() {
  const [uniqueStoreIds, session] = await Promise.all([
    getUniqueStoreIds(),
    auth(),
  ]);

  return (
    <Shell>
      <PageHeader
        id="cart-page-header"
        aria-labelledby="cart-page-header-heading"
      >
        <PageHeaderHeading size="sm">Checkout</PageHeaderHeading>
        <PageHeaderDescription size="sm">
          Checkout with your cart items
        </PageHeaderDescription>
      </PageHeader>
      {uniqueStoreIds.length > 0 ? (
        uniqueStoreIds.map(
          (storeId) =>
            storeId && (
              <CheckoutCard
                key={storeId}
                storeId={storeId}
                userId={session?.user.id || ""}
              />
            ),
        )
      ) : (
        <section
          id="cart-page-empty-cart"
          aria-labelledby="cart-page-empty-cart-heading"
          className="flex h-full flex-col items-center justify-center space-y-1 pt-16"
        >
          <Icons.cart
            className="text-muted-foreground mb-4 size-16"
            aria-hidden="true"
          />
          <div className="text-muted-foreground text-xl font-medium">
            Your cart is empty
          </div>
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
        </section>
      )}
    </Shell>
  );
}
