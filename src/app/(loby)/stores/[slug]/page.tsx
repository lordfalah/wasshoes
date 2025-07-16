import { type Metadata } from "next";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { AlertCard } from "@/components/alert-card";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ui/product-card";
import { ProductImageCarousel as BanerImageCarousel } from "../../product/[productId]/_components/product-image-carousel";

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Products",
  description: "Buy products from our stores",
};

interface StoreSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StoreSlugPage({ params }: StoreSlugPageProps) {
  const storeSlug = decodeURIComponent((await params).slug);

  const store = await db.store.findUnique({
    select: {
      id: true,
      name: true,
      mapEmbed: true,
      bannerImgs: true,
      description: true,
    },
    where: {
      slug: storeSlug,
    },
  });

  if (!store) {
    notFound();
  }

  const packages = await db.paket.findMany({
    where: {
      stores: {
        some: {
          id: store.id,
        },
      },
    },

    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      price: true,
      isVisible: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 8,
  });

  return (
    <Shell>
      <BanerImageCarousel
        className="h-fit rounded-md sm:h-[400px]"
        images={store.bannerImgs ?? []}
        options={{
          loop: true,
        }}
      />

      <PageHeader>
        <PageHeaderHeading size="sm">Store {store.name}</PageHeaderHeading>
        <PageHeaderDescription size="sm">
          {store.description}
        </PageHeaderDescription>
      </PageHeader>

      <section
        className="animate-fade-up xs:grid-cols-2 grid grid-cols-1 gap-4 md:grid-cols-4"
        style={{ animationDelay: "0.50s", animationFillMode: "both" }}
      >
        {packages.length > 0 ? (
          packages.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <AlertCard
            title="Doesn't have Package"
            description="Please contact owner"
          />
        )}
      </section>

      <section
        className="animate-fade-up w-full space-y-8"
        style={{ animationDelay: "0.80s", animationFillMode: "both" }}
      >
        <PageHeader>
          <PageHeaderHeading size="sm">Location</PageHeaderHeading>
          <PageHeaderDescription size="sm">
            This location store on google maps
          </PageHeaderDescription>
        </PageHeader>

        <iframe
          src={store.mapEmbed}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[350px] w-full rounded-2xl border-0 border-none"
        />
      </section>
    </Shell>
  );
}
