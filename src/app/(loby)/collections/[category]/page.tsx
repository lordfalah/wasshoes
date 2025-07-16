import { db } from "@/lib/db";
import { toTitleCase } from "@/lib/utils";
import { Metadata } from "next";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { AlertCard } from "@/components/alert-card";
import { ProductCard } from "@/components/ui/product-card";

interface CollectionCategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateMetadata({
  params,
}: CollectionCategoryPageProps): Promise<Metadata> {
  const categoryId = decodeURIComponent((await params).category);
  const category = await db.category.findFirst({
    select: {
      name: true,
      description: true,
    },

    where: {
      id: categoryId,
    },
  });

  if (!category) {
    return {};
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL as string),
    title: toTitleCase(category.name),
    description: category.description,
  };
}

export default async function CollectionCategoryPage({
  params,
}: CollectionCategoryPageProps) {
  const categoryId = decodeURIComponent((await params).category);
  const [packages, category] = await Promise.all([
    db.paket.findMany({
      where: {
        categoryId: categoryId,
        isVisible: true,
      },
      take: 8,
    }),
    db.category.findFirst({
      where: {
        id: categoryId,
      },
      select: {
        name: true,
      },
    }),
  ]);

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading size="sm">
          Category {category && `: ${category.name}`}{" "}
        </PageHeaderHeading>
        <PageHeaderDescription size="sm">
          Buy products from our category
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
