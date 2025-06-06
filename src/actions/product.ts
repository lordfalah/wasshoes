"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/lib/handle-error";

export async function filterPakets({ query }: { query: string }) {
  try {
    if (query.trim().length === 0) {
      return {
        data: null,
        error: null,
      };
    }

    const categoriesWithPakets = await db.category.findMany({
      where: {
        name: {
          contains: query.trim(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        pakets: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      data: categoriesWithPakets,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

type PaketInput = {
  paketId: string;
  quantity: number;
};

export async function getTotalPriceAndItemDetails(pakets: PaketInput[]) {
  const paketMap = new Map(pakets.map((p) => [p.paketId, p.quantity]));

  const foundPakets = await db.paket.findMany({
    where: {
      id: { in: Array.from(paketMap.keys()) },
    },
    select: {
      id: true,
      name: true,
      price: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (foundPakets.length !== paketMap.size) {
    throw new Error("Beberapa paket tidak ditemukan di database");
  }

  let total = 0;
  const item_details = foundPakets.map((p) => {
    const quantity = paketMap.get(p.id) ?? 0;
    const subtotal = p.price * quantity;
    total += subtotal;

    return {
      id: p.id,
      name: p.name,
      quantity,
      price: p.price,
      category: p.category?.name,
    };
  });

  return { total, item_details };
}
