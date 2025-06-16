import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { formatToRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CartLineItems } from "@/components/checkout/cart-line-items";
import { notFound, redirect } from "next/navigation";
import { getCart } from "@/actions/cart";
import { DialogTitle } from "@/components/ui/dialog";
import CheckoutFormDetailUser from "@/components/checkout/checkout-form-detail-user";
import { auth } from "@/auth";
import CheckoutFormDetailAdmin from "@/components/checkout/checkout-form-detail-admin";
import { Fragment } from "react";

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

  const session = await auth();

  const store = await db.store.findUnique({
    select: {
      id: true,
      name: true,
      mapEmbed: true,
    },
    where: {
      id: storeId,
    },
  });

  if (!store) {
    notFound();
  }

  const cartLineItems = await getCart({ storeId });

  if (!cartLineItems || cartLineItems.length === 0) redirect("/invoice");

  const subtotalPrice = cartLineItems.reduce((acc, item) => {
    return acc + Number(item.price) * Number(item.quantity);
  }, 0);

  const finalPrice = cartLineItems.reduce((acc, item) => {
    // Jika item.priceOrder sudah merupakan TOTAL untuk item tersebut,
    // maka cukup gunakan nilai itu tanpa dikalikan quantity lagi.
    return (
      acc +
      (item.priceOrder !== undefined && item.priceOrder !== null
        ? Number(item.priceOrder) // HANYA gunakan nilai ini
        : Number(item.price) * Number(item.quantity)) // Jika priceOrder tidak ada, hitung dari harga paket asli
    );
  }, 0);

  // --- LOGIKA DISKON/BIAYA TAMBAHAN ---
  let adjustmentText: string | null = null;
  let adjustmentAmount = 0;

  if (finalPrice > subtotalPrice) {
    adjustmentAmount = finalPrice - subtotalPrice;
    console.log({ adjustmentAmount });
    adjustmentText = `Biaya Tambahan: ${formatToRupiah(adjustmentAmount)}`;
  } else if (finalPrice < subtotalPrice) {
    adjustmentAmount = subtotalPrice - finalPrice;
    adjustmentText = `Diskon Biaya: ${formatToRupiah(adjustmentAmount)}`;
  }
  // console.log({ subtotalPrice, finalPrice });

  return (
    <section className="relative flex h-full min-h-dvh flex-col items-start justify-center lg:h-dvh lg:flex-row lg:overflow-hidden">
      <div className="w-full space-y-12 pt-8 lg:pt-16">
        <div className="fixed top-0 z-40 h-16 w-full bg-white py-4 lg:static lg:top-auto lg:z-0 lg:h-0 lg:py-0 dark:bg-[#09090b]">
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
                id="detail-content"
                aria-describedby={"Detail Content"}
                className="mx-auto flex h-[82%] w-full max-w-4xl flex-col space-y-6 border px-4 pt-8 pb-6"
              >
                <CartLineItems
                  items={cartLineItems}
                  variant="default"
                  isEditable={false}
                  className="container h-full flex-1"
                />

                <DialogTitle className="text-center">Location</DialogTitle>
                <DrawerDescription>
                  <iframe
                    src={store.mapEmbed}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-[250px] w-full rounded-2xl border-0 border-none"
                  />
                </DrawerDescription>

                <div className="container space-y-4 pr-8">
                  <Separator />
                  <div className="flex font-medium">
                    <div className="flex-1">
                      SubTotal (
                      {cartLineItems.reduce(
                        (acc, item) => acc + Number(item.quantity),
                        0,
                      )}
                      )
                    </div>
                    <div>Rp. {formatToRupiah(subtotalPrice)}</div>
                  </div>

                  {adjustmentText && ( // Hanya render jika ada penyesuaian
                    <Fragment>
                      <div className="text-muted-foreground flex font-medium">
                        <div className="flex-1">
                          {adjustmentText.split(":")[0]}:
                        </div>{" "}
                        {/* Ambil label "Biaya Tambahan" atau "Diskon Biaya" */}
                        <div>{adjustmentText.split(":")[1]}</div>{" "}
                        {/* Ambil nilai yang sudah diformat */}
                      </div>

                      <div className="flex font-medium">
                        <div className="flex-1">Final</div>
                        <div>Rp. {formatToRupiah(finalPrice)}</div>
                      </div>
                    </Fragment>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        <div className="container flex max-w-xl flex-col items-center space-y-1 lg:mr-0 lg:ml-auto lg:items-start lg:pr-[4.5rem]">
          <div className="text-muted-foreground line-clamp-1 font-semibold">
            Pay {store.name}
          </div>
          <div className="text-3xl font-bold">
            Rp. {formatToRupiah(finalPrice)}
          </div>
        </div>
        <CartLineItems
          items={cartLineItems}
          isEditable={false}
          className="container hidden w-full max-w-xl lg:mr-0 lg:ml-auto lg:flex lg:max-h-[580px] lg:pr-[4.5rem]"
        />
      </div>

      <section className="size-full flex-1 bg-[#09090b] px-4 pt-10 pb-12 lg:flex-initial lg:px-12 lg:pt-16 dark:bg-white">
        {session && (
          <ScrollArea className="h-full w-auto pr-0 lg:w-fit lg:pr-6">
            {session.user.role.name === "USER" && (
              <CheckoutFormDetailUser
                carts={cartLineItems}
                storeId={store.id}
              />
            )}

            {session.user.role.name === "ADMIN" && (
              <CheckoutFormDetailAdmin
                carts={cartLineItems}
                storeId={store.id}
              />
            )}
          </ScrollArea>
        )}
      </section>
    </section>
  );
}
