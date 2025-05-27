import { Suspense } from "react";
import { LobbySkeleton } from "./_components/lobby-skeleton";
import { db } from "@/lib/db";
import Loby from "./_components/loby";
import { Paket } from "@prisma/client";

import { getFeaturedStores } from "@/actions/store";

export default async function RootLoby() {
  const packagePromise = db.paket.findMany({
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

  const categorysPromise = db.category.findMany();
  const storesPromise = getFeaturedStores();

  return (
    <Suspense fallback={<LobbySkeleton />}>
      <Loby
        categorysPromise={categorysPromise}
        packagePromise={packagePromise as Promise<Array<Paket>>}
        storesPromise={storesPromise}
      />
    </Suspense>
  );
}
