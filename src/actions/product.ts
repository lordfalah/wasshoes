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
