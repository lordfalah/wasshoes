import { Suspense } from "react";
import { LobbySkeleton } from "./_components/lobby-skeleton";
import { db } from "@/lib/db";
import Loby from "./_components/loby";
import { Paket } from "@prisma/client";
import { ClientUploadedFileData } from "uploadthing/types";

export default async function RootLoby() {
  const packagePromise = db.paket.findMany({
    // select: {
    //   id: true,
    //   name: true,
    //   description: true,
    //   image: true,
    //   price: true,
    //   isVisible: true,
    // },
    orderBy: {
      name: "asc",
    },
    take: 8,
  });

  const categorysPromise = db.category.findMany();
  const storesPromise = db.store.findMany({
    
  });

  return (
    <Suspense fallback={<LobbySkeleton />}>
      <Loby
        categorysPromise={categorysPromise}
        packagePromise={
          packagePromise as Promise<
            Array<
              Paket & {
                image: ClientUploadedFileData<{
                  uploadedBy: string | undefined;
                }>;
              }
            >
          >
        }
        storesPromise={storesPromise}
      />
    </Suspense>
  );
}
