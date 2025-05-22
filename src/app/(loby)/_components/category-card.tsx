import * as React from "react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { Category, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export function CategoryCard({ category }: { category: Category }) {
  const productCountPromise = db.paket.count({
    where: {
      categoryId: category.id,
    },
  });

  return (
    <Link href={`/collections/${category.name}`}>
      <Card className="hover:bg-muted/25 h-full rounded-lg transition-colors">
        <CardHeader className="flex-1">
          <CardTitle className="capitalize">{category.name}</CardTitle>
          <CardDescription className="line-clamp-3 text-balance">
            {category.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <React.Suspense fallback={<Skeleton className="h-4 w-20" />}>
            <ProductCount productCountPromise={productCountPromise} />
          </React.Suspense>
        </CardContent>
      </Card>
    </Link>
  );
}

async function ProductCount({
  productCountPromise,
}: {
  productCountPromise: Prisma.PrismaPromise<number>;
}) {
  const count = await productCountPromise;

  return (
    <div className="text-muted-foreground flex w-fit items-center text-[0.8rem]">
      <Icons.product className="mr-1.5 size-3.5" aria-hidden="true" />
      {count} products
    </div>
  );
}
