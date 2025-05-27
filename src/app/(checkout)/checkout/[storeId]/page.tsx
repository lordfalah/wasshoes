import type { Metadata } from "next";

import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { formatToRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CartLineItems } from "@/components/checkout/cart-line-items";
import { Shell } from "@/components/shell";
import { notFound } from "next/navigation";
import { getCart } from "@/actions/cart";
import { DialogTitle } from "@/components/ui/dialog";

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Checkout",
  description: "Checkout with store items",
};

interface CheckoutPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const storeId = decodeURIComponent((await params).storeId);

  const store = await db.store.findFirst({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: storeId,
    },
  });

  if (!store) {
    notFound();
  }

  const cartLineItems = await getCart({ storeId });

  const total = cartLineItems.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.price),
    0,
  );

  return (
    <section className="relative flex h-full min-h-dvh flex-col items-start justify-center lg:h-dvh lg:flex-row lg:overflow-hidden">
      <div className="w-full space-y-12 pt-8 lg:pt-16">
        <div className="fixed top-0 z-40 h-16 w-full bg-[#09090b] py-4 lg:static lg:top-auto lg:z-0 lg:h-0 lg:py-0">
          <div className="container flex max-w-xl items-center justify-between space-x-2 lg:mr-0 lg:ml-auto lg:pr-[4.5rem]">
            <Link
              aria-label="Back to cart"
              href="/cart"
              className="group flex w-28 items-center space-x-2 lg:flex-auto"
            >
              <ArrowLeftIcon
                className="text-muted-foreground group-hover:text-primary size-5 transition-colors"
                aria-hidden="true"
              />
              <div className="block font-medium transition group-hover:hidden">
                Skateshop
              </div>
              <div className="hidden font-medium transition group-hover:block">
                Back
              </div>
            </Link>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </DrawerTrigger>
              <DrawerContent
                aria-describedby={"WOI ASU"}
                className="mx-auto flex h-[82%] w-full max-w-4xl flex-col space-y-6 border pt-8 pb-6"
              >
                <CartLineItems
                  items={cartLineItems}
                  variant="minimal"
                  isEditable={false}
                  className="container h-full flex-1 pr-8"
                />
                <DialogTitle className="sr-only">Detail</DialogTitle>
                <div className="container space-y-4 pr-8">
                  <Separator />
                  <div className="flex font-medium">
                    <div className="flex-1">
                      Total (
                      {cartLineItems.reduce(
                        (acc, item) => acc + Number(item.quantity),
                        0,
                      )}
                      )
                    </div>
                    <div>Rp. {formatToRupiah(total)}</div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        <div className="container flex max-w-xl flex-col items-center space-y-1 lg:mr-0 lg:ml-auto lg:items-start lg:pr-[4.5rem]">
          <div className="text-muted-foreground line-clamp-1 font-semibold">
            Pay {store.name}
          </div>
          <div className="text-3xl font-bold">Rp. {formatToRupiah(total)}</div>
        </div>
        <CartLineItems
          items={cartLineItems}
          isEditable={false}
          className="container hidden w-full max-w-xl lg:mr-0 lg:ml-auto lg:flex lg:max-h-[580px] lg:pr-[4.5rem]"
        />
      </div>
      {/* <CheckoutShell
        paymentIntentPromise={paymentIntentPromise}
        storeStripeAccountId={store.stripeAccountId}
        className="size-full flex-1 bg-white pb-12 pt-10 lg:flex-initial lg:pl-12 lg:pt-16"
      >
        <ScrollArea className="h-full">
          <CheckoutForm
            storeId={store.id}
            className="container max-w-xl pr-6 lg:ml-0 lg:mr-auto"
          />
        </ScrollArea>
      </CheckoutShell> */}
    </section>
  );
}
