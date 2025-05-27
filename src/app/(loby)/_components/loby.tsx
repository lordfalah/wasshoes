import { ContentSection } from "@/components/content-section";
import { Icons } from "@/components/icons";
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Category, Paket } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { CategoryCard } from "./category-card";
import { ProductCard } from "@/components/ui/product-card";
import { SparklesText } from "@/components/ui/sparkles-text";
import { StoreCard } from "@/components/ui/store-card";
import { getFeaturedStores } from "@/actions/store";

const Loby: React.FC<{
  packagePromise: Promise<Array<Paket>>;
  categorysPromise: Promise<Category[]>;
  storesPromise: ReturnType<typeof getFeaturedStores>;
}> = async ({ packagePromise, categorysPromise, storesPromise }) => {
  const [packages, categorys, stores] = await Promise.all([
    packagePromise,
    categorysPromise,
    storesPromise,
  ]);

  return (
    <Shell className="max-w-6xl gap-0">
      <PageHeader
        as="section"
        className="mx-auto items-center gap-2 text-center"
        withPadding
      >
        <Badge
          aria-hidden="true"
          variant="secondary"
          className="animate-fade-up rounded-full px-3.5 py-1.5"
          style={{ animationDelay: "0.10s", animationFillMode: "both" }}
        >
          <Icons.store className="mr-2 size-3.5" aria-hidden="true" />
          {stores.length} stores on Wasshoes
        </Badge>

        <PageHeaderHeading
          className="animate-fade-up"
          style={{ animationDelay: "0.20s", animationFillMode: "both" }}
        >
          <SparklesText text="Wasshoes Pontianak" />
        </PageHeaderHeading>
        <PageHeaderDescription
          className="animate-fade-up max-w-[46.875rem]"
          style={{ animationDelay: "0.30s", animationFillMode: "both" }}
        >
          Skateshop is an open-source platform for building and customizing your
          own commerce platform with ease.
        </PageHeaderDescription>
        <PageActions
          className="animate-fade-up"
          style={{ animationDelay: "0.40s", animationFillMode: "both" }}
        >
          <Link href="/products" className={cn(buttonVariants())}>
            Buy now
          </Link>
          <Link
            href="/dashboard/stores"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Sell now
          </Link>
        </PageActions>
      </PageHeader>
      <section
        className="animate-fade-up xs:grid-cols-2 grid grid-cols-1 gap-4 md:grid-cols-4"
        style={{ animationDelay: "0.50s", animationFillMode: "both" }}
      >
        {categorys.map((category) => (
          <CategoryCard key={category.name} category={category} />
        ))}
      </section>
      <ContentSection
        title="Featured products"
        description="Explore products from around the world"
        href="/products"
        linkText="View all products"
        className="pt-14 md:pt-20 lg:pt-24"
      >
        {packages.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ContentSection>
      <ContentSection
        title="Featured stores"
        description="Explore stores from around the world"
        href="/stores"
        linkText="View all stores"
        className="py-14 md:py-20 lg:py-24"
      >
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            href={`/products?store_ids=${store.id}`}
          />
        ))}
      </ContentSection>
    </Shell>
  );
};

export default Loby;
