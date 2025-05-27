"use server";

import {
  cartItemSchema,
  deleteCartItemSchema,
  deleteCartItemsSchema,
  TCartItemSchema,
} from "@/schemas/cart.schema";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getErrorMessage } from "@/lib/handle-error";
import { Category, Paket, Store } from "@prisma/client";
import { auth } from "@/auth";

export type CartLineItem = Paket & {
  quantity: number;
  stores: Store[];
  category: Category | null;
};

export async function getCart(input?: {
  storeId?: string;
}): Promise<CartLineItem[]> {
  try {
    const session = await auth();

    const cart = await db.cart.findFirst({
      where: { userId: session?.user.id, closed: false },
      select: { items: true },
    });

    const items = cart?.items as TCartItemSchema[] | undefined;
    if (!items || items.length === 0) return [];

    const paketIds = items.map((item) => item.productId);
    const pakets = await db.paket.findMany({
      where: {
        id: { in: paketIds },
        ...(input?.storeId && {
          stores: { some: { id: input.storeId } },
        }),
      },
      include: {
        stores: true,
        category: true,
      },
    });

    return pakets.map((paket) => ({
      ...paket,
      quantity:
        items.find((item) => item.productId === paket.id)?.quantity ?? 0,
    }));
  } catch (error) {
    console.error("GET_CART_ERROR:", error);
    return [];
  }
}

export async function getUniqueStoreIds() {
  const session = await auth();

  if (!session || !session.user.id) return [];

  try {
    const cart = await db.cart.findFirst({
      where: { userId: session.user.id, closed: false },
      select: { items: true },
    });

    if (!cart || !cart.items || cart.items.length === 0) return [];

    // Ambil semua productId dari items cart
    const productIds = cart.items.map((item) => item.productId);

    // Ambil semua paket yang berkaitan dan ambil store-nya
    const pakets = await db.paket.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        stores: {
          select: { id: true },
        },
      },
    });

    // Kumpulkan semua storeId unik dari paket
    const storeIds = [
      ...new Set(
        pakets.flatMap((paket) => paket.stores.map((store) => store.id)),
      ),
    ];

    return storeIds;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    return [];
  }
}

export async function addToCart(rawInput: z.infer<typeof cartItemSchema>) {
  try {
    const session = await auth();
    if (!session?.user.id) throw new Error("Not Authorized");

    const input = cartItemSchema.parse(rawInput);

    const paket = await db.paket.findUnique({
      where: { id: input.productId },
      select: { isVisible: true },
    });

    if (!paket || !paket.isVisible) {
      throw new Error("Paket tidak ditemukan atau tidak tersedia.");
    }

    let cart = await db.cart.findFirst({
      where: { userId: session?.user.id, closed: false },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: {
          userId: session.user.id,
          items: [input],
        },
      });
      return { data: cart.items, error: null };
    }

    const items = cart.items ?? [];
    const index = items.findIndex((item) => item.productId === input.productId);

    if (index !== -1) {
      items[index].quantity += input.quantity;
    } else {
      items.push(input);
    }

    const updatedCart = await db.cart.update({
      where: { id: cart.id },
      data: { items },
    });

    revalidatePath("/");

    return { data: updatedCart.items, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function updateCartItem(rawInput: TCartItemSchema) {
  try {
    const session = await auth();
    if (!session?.user.id) throw new Error("Not Authorized");

    const input = cartItemSchema.parse(rawInput);

    const cart = await db.cart.findFirst({
      where: { userId: session.user.id, closed: false },
    });

    if (!cart) {
      throw new Error("Cart not found.");
    }

    let updatedItems: TCartItemSchema[] = [];

    const currentItems = Array.isArray(cart.items) ? cart.items : [];

    if (input.quantity === 0) {
      // Remove item if quantity is 0
      updatedItems = currentItems.filter(
        (item) => item.productId !== input.productId,
      );
    } else {
      const existingItem = currentItems.find(
        (item) => item.productId === input.productId,
      );

      if (existingItem) {
        // Update existing item quantity
        updatedItems = currentItems.map((item) =>
          item.productId === input.productId
            ? { ...item, quantity: input.quantity }
            : item,
        );
      } else {
        // Add new item if not exists
        updatedItems = [...currentItems, input];
      }
    }

    await db.cart.update({
      where: { id: cart.id },
      data: { items: updatedItems },
    });

    revalidatePath("/");

    return {
      data: updatedItems,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteCart() {
  try {
    const session = await auth();
    if (!session?.user.id) throw new Error("Not Authorized");

    const cart = await db.cart.findFirst({
      where: { userId: session.user.id, closed: false },
    });

    if (!cart) {
      throw new Error("Cart not found.");
    }

    await db.cart.delete({
      where: { id: cart.id },
    });

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteCartItem(
  input: z.infer<typeof deleteCartItemSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user.id) throw new Error("Not Authorized");

    const cart = await db.cart.findFirst({
      where: { userId: session.user.id, closed: false },
    });

    if (!cart) return;

    const currentItems = Array.isArray(cart.items) ? cart.items : [];
    const updatedItems = currentItems.filter(
      (item) => item.productId !== input.productId,
    );

    await db.cart.update({
      where: { id: cart.id },
      data: { items: updatedItems },
    });

    revalidatePath("/");

    return {
      data: updatedItems,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteCartItems(
  input: z.infer<typeof deleteCartItemsSchema>,
) {
  try {
    const session = await auth();
    if (!session?.user.id) throw new Error("Not Authorized");

    const cart = await db.cart.findFirst({
      where: { userId: session.user.id, closed: false },
    });

    if (!cart) return;

    const currentItems = Array.isArray(cart.items) ? cart.items : [];

    const updatedItems = currentItems.filter(
      (item) => !input.productIds.includes(item.productId),
    );

    await db.cart.update({
      where: { id: cart.id },
      data: { items: updatedItems },
    });

    revalidatePath("/");

    return {
      data: updatedItems,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
