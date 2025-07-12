import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatToRupiah, toTitleCase } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Rating } from "@/components/rating";
import { Shell } from "@/components/shell";
import { db } from "@/lib/db";
import { ProductImageCarousel } from "./_components/product-image-carousel";
import { ProductCard } from "@/components/ui/product-card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";
import AddToCartForm from "./_components/add-to-cart-form";

interface ProductPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const productId = decodeURIComponent((await params).productId);
  const product = await db.paket.findFirst({
    select: {
      name: true,
      description: true,
    },

    where: {
      id: productId,
    },
  });

  if (!product) {
    return {};
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL as string),
    title: toTitleCase(product.name),
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productId = decodeURIComponent((await params).productId);

  const product = await db.paket.findFirst({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      image: true,
      stores: true,
      category: true,
      isVisible: true,
    },

    where: {
      id: productId,
    },
  });

  if (!product) {
    notFound();
  }

  // Ambil semua storeId yang terkait dengan produk ini
  const storeIds = product.stores.map((store) => store.id);

  const otherProducts = await db.paket.findMany({
    where: {
      id: { not: productId },
      stores: {
        some: {
          id: { in: storeIds },
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      image: true,
      category: true,
    },
    take: 4,
  });

  return (
    <Shell className="pb-12 md:pb-14">
      <div className="flex flex-col gap-8 md:flex-row md:gap-16">
        <ProductImageCarousel
          className="w-full md:w-1/2"
          images={product.image ?? []}
          options={{
            loop: true,
          }}
          showChildImg={true}
        />
        <Separator className="mt-4 md:hidden" />
        <div className="flex w-full flex-col gap-4 md:w-1/2">
          <div className="space-y-2">
            <h2 className="line-clamp-1 text-2xl font-bold">{product.name}</h2>
            <p className="text-muted-foreground text-base">
              {formatToRupiah(product.price)}
            </p>
            {product.stores.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <Store
                  className="text-muted-foreground size-6"
                  aria-hidden="true"
                />
                {product.stores.map(({ id, name }) => (
                  <Badge variant="outline" key={id}>
                    <Link
                      href={`/products?store_ids=${id}`}
                      className="text-muted-foreground line-clamp-1 inline-block text-base hover:underline"
                    >
                      {name}
                    </Link>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <Separator className="my-1.5" />
          <p className="text-muted-foreground text-base">
            {product.isVisible ? "Ready in stock" : "Chat Admin"}
          </p>
          <div className="flex items-center justify-between">
            <Rating rating={Math.round(2 / 5)} />
            {/* <UpdateProductRatingButton
              productId={product.id}
              rating={product.rating}
            /> */}
          </div>
          <AddToCartForm productId={productId} showBuyNow={true} />
          <Separator className="mt-5" />
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="description"
          >
            <AccordionItem value="description" className="border-none">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent>
                {product.description ??
                  "No description is available for this product."}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator className="md:hidden" />
        </div>
      </div>
      {product.stores.length > 0 && otherProducts.length > 0 ? (
        <div className="space-y-6 overflow-hidden">
          <h2 className="line-clamp-1 flex-1 text-2xl font-bold">
            More products from{" "}
            <span className="space-x-2.5">
              {product.stores.map(({ name, id }) => (
                <Badge variant="secondary" key={id}>
                  {name}
                </Badge>
              ))}
            </span>
          </h2>
          <ScrollArea className="pb-3.5">
            <div className="flex gap-4">
              {otherProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="max-w-lg min-w-[260px]"
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ) : null}
    </Shell>
  );
}
