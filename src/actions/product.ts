"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/lib/handle-error";

type TItemDetail = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  brand?: string;
  category?: string;
  merchant_name?: string;
  url?: string;
};

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
  priceOrder?: number | null;
};

export async function getTotalPriceAndItemDetails(
  paketsInput: PaketInput[],
  isAdmin = false,
): Promise<{ total: number; item_details: TItemDetail[] }> {
  const paketMap = new Map(paketsInput.map((p) => [p.paketId, p.quantity]));

  const foundPakets = await db.paket.findMany({
    where: {
      id: { in: Array.from(paketMap.keys()) },
    },
    select: {
      id: true,
      name: true,
      price: true, // Ini adalah harga dasar PER UNIT dari DB
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (foundPakets.length !== paketMap.size) {
    throw new Error("Beberapa paket tidak ditemukan di database.");
  }

  const { totalGrossAmount, item_details } = foundPakets.reduce(
    (acc, p) => {
      const quantity = paketMap.get(p.id) ?? 0;
      if (quantity === 0) return acc;

      const inputPaket = paketsInput.find((pkt) => pkt.paketId === p.id);
      const customTotalPrice = inputPaket?.priceOrder; // <-- Ini adalah harga TOTAL dari input

      let effectivePriceForMidtrans: number; // Ini akan menjadi 'price' di Midtrans ItemDetails
      let actualQuantityForMidtrans: number; // Ini akan menjadi 'quantity' di Midtrans ItemDetails

      // Logika khusus untuk ADMIN jika ada customTotalPrice
      const hasCustomTotal =
        isAdmin &&
        customTotalPrice !== undefined &&
        customTotalPrice !== null &&
        customTotalPrice > 0; // <— hanya true jika > 0

      if (hasCustomTotal) {
        effectivePriceForMidtrans = Number(customTotalPrice);
        actualQuantityForMidtrans = 1;
      } else {
        effectivePriceForMidtrans = Number(p.price);
        actualQuantityForMidtrans = quantity;
      }

      // Hitung total harga untuk baris item ini
      // Selalu (effectivePriceForMidtrans * actualQuantityForMidtrans)
      const itemCalculatedTotalPrice =
        effectivePriceForMidtrans * actualQuantityForMidtrans;

      // Tambahkan ke total keseluruhan
      acc.totalGrossAmount += itemCalculatedTotalPrice;

      // Tambahkan ke item_details untuk Midtrans
      acc.item_details.push({
        id: p.id,
        name: p.name,
        quantity: actualQuantityForMidtrans, // Quantity untuk Midtrans
        price: effectivePriceForMidtrans, // Harga PER UNIT untuk Midtrans
        category: p.category?.name,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${p.id}`,
      });

      return acc;
    },
    { totalGrossAmount: 0, item_details: [] as TItemDetail[] },
  );

  return { total: totalGrossAmount, item_details };
}
