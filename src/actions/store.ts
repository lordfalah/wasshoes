"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/lib/handle-error";

export async function getStoresByUserId(input: { userId: string }) {
  try {
    return db.store.findFirst({
      where: {
        id: input.userId,
      },

      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        _count: {
          select: {
            pakets: true,
          },
        },
      },

      orderBy: {
        pakets: {
          _count: "asc",
        },
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getFeaturedStores() {
  try {
    return await db.store.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        _count: {
          select: {
            pakets: true,
          },
        },
      },
      orderBy: {
        pakets: {
          _count: "desc", // ditampilkan berdasarkan jumlah produk terbanyak
        },
      },
      take: 4,
    });
  } catch (error) {
    throw error;
  }
}

export async function getStoreByStoreId(storeId: string | null) {
  try {
    if (!storeId) throw new Error("Store ID required!");

    const store = await db.store.findFirst({
      where: {
        id: storeId,
      },
      include: {
        pakets: {
          where: {
            isVisible: true, // opsional: hanya tampilkan produk yang aktif/terlihat
          },
          include: {
            category: true, // jika ingin sekaligus ambil kategori produk
          },
        },
      },
    });

    return {
      data: store,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
