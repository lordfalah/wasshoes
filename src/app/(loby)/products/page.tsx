import { type Metadata } from "next";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { AlertCard } from "@/components/alert-card";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ui/product-card";

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Products",
  description: "Buy products from our stores",
};

export default async function ProductsPage() {
  const packages = await db.paket.findMany({
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
      <PageHeader>
        <PageHeaderHeading size="sm">Products</PageHeaderHeading>
        <PageHeaderDescription size="sm">
          Buy products from our stores
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
          <AlertCard />
        )}
      </section>
    </Shell>
  );
}
