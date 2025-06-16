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
import { Category, Paket, Store, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type CartLineItem = Paket & {
  quantity: number;
  priceOrder?: number | null;
  stores: Store[];
  category: Category | null;
};

export async function getCart(input?: {
  storeId?: string;
}): Promise<CartLineItem[]> {
  await connection();
  try {
    const [session, cookieStore] = await Promise.all([auth(), cookies()]);
    if (!session || !session.user?.id) return [];

    const userId = session.user.id;
    const cartIdFromCookie = cookieStore.get("cartId")?.value;

    let cart = null;

    if (cartIdFromCookie) {
      cart = await db.cart.findUnique({
        where: { id: cartIdFromCookie },
        select: { id: true, closed: true, items: true },
      });

      // Jika cart tidak ditemukan atau sudah ditutup, cari cart aktif dari user
      if (!cart || cart.closed) {
        cart = await db.cart.findFirst({
          where: { userId, closed: false },
          select: { id: true, closed: true, items: true },
        });
      }
    } else {
      // Tidak ada cookie, cari cart aktif berdasarkan user
      cart = await db.cart.findFirst({
        where: { userId, closed: false },
        select: { id: true, closed: true, items: true },
      });
    }

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

    return pakets.map((paket) => {
      const item = items.find((item) => item.productId === paket.id);

      return {
        ...paket,
        quantity: item?.quantity ?? 0,
        priceOrder: item?.priceOrder, // tambahkan ini
      };
    });
  } catch (error) {
    console.error("GET_CART_ERROR:", error);
    return [];
  }
}

export async function getUniqueStoreIds(): Promise<string[]> {
  await connection();
  const session = await auth();

  if (!session || !session.user?.id) return [];

  try {
    const cart = await db.cart.findFirst({
      where: { userId: session.user.id, closed: false },
      select: { items: true },
    });

    if (!cart || !cart.items || cart.items.length === 0) return [];

    const productIds = cart.items.map((item) => item.productId);

    const pakets = await db.paket.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        stores: {
          select: { id: true },
        },
      },
    });

    const storeIds = [
      ...new Set(
        pakets.flatMap((paket) => paket.stores.map((store) => store.id)),
      ),
    ];

    return storeIds;
  } catch (err) {
    console.error("GET_UNIQUE_STORE_IDS_ERROR:", err);
    return [];
  }
}

export async function addToCart(rawInput: z.infer<typeof cartItemSchema>) {
  await connection();

  try {
    const input = cartItemSchema.parse(rawInput);

    const [session, cookieStore] = await Promise.all([auth(), cookies()]);
    const userId = session?.user?.id;
    if (!userId) redirect("/");

    const cartIdFromCookie = cookieStore.get("cartId")?.value;

    // Cek apakah produk valid dan visible
    const paket = await db.paket.findUnique({
      where: { id: input.productId },
      select: { isVisible: true },
    });

    if (!paket || !paket.isVisible) {
      throw new Error("Paket tidak ditemukan atau tidak tersedia.");
    }

    let cart = null;

    // 1. Coba ambil cart dari cookie
    if (cartIdFromCookie) {
      cart = await db.cart.findUnique({
        where: { id: cartIdFromCookie },
      });

      // Jika cart tidak ditemukan atau sudah ditutup, hapus cookie dan reset cart
      if (!cart || cart.closed) {
        cookieStore.set("cartId", "", { expires: new Date(0) });
        cart = null;
      }
    }

    // 2. Jika tidak ada cart valid di cookie, cari berdasarkan user login
    if (!cart && userId) {
      cart = await db.cart.findFirst({
        where: { userId, closed: false },
      });
    }

    // 3. Jika tetap belum ada, buat cart baru
    if (!cart) {
      cart = await db.cart.create({
        data: {
          userId: userId,
          items: [input],
        },
      });

      // Simpan cartId ke cookie
      cookieStore.set("cartId", cart.id, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      });

      revalidatePath("/");
      return { data: cart.items, error: null };
    }

    // 4. Update cart jika sudah ada
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
  await connection();

  try {
    const [session, cookieStore] = await Promise.all([auth(), cookies()]);
    const input = cartItemSchema.parse(rawInput);

    const userId = session?.user.id;
    const isAdmin = session?.user.role?.name === UserRole.ADMIN;
    const cartId = cookieStore.get("cartId")?.value;

    const cart = await db.cart.findFirst({
      where: {
        ...(userId ? { userId } : { id: cartId }),
        closed: false,
      },
    });

    if (!cart) throw new Error("Cart not found.");

    let updatedItems: TCartItemSchema[] = [];
    const currentItems = Array.isArray(cart.items) ? cart.items : [];

    const existingItem = currentItems.find(
      (item) => item.productId === input.productId,
    );

    if (input.quantity === 0 && !isAdmin) {
      // Hapus item jika quantity 0, hanya untuk user
      updatedItems = currentItems.filter(
        (item) => item.productId !== input.productId,
      );
    } else if (existingItem) {
      updatedItems = currentItems.map((item) => {
        if (item.productId === input.productId) {
          return {
            ...item,
            quantity: input.quantity,
            ...(isAdmin && input.priceOrder !== undefined
              ? { priceOrder: input.priceOrder }
              : {}),
          };
        }
        return item;
      });
    } else {
      updatedItems = [
        ...currentItems,
        {
          ...input,
          ...(isAdmin && input.priceOrder !== undefined
            ? { priceOrder: input.priceOrder }
            : {}),
        },
      ];
    }

    await db.cart.update({
      where: { id: cart.id },
      data: { items: updatedItems },
    });

    revalidatePath("/");

    return { data: updatedItems, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function deleteCart() {
  await connection();

  try {
    const [session, cookieStore] = await Promise.all([auth(), cookies()]);
    const userId = session?.user.id;
    const cartId = cookieStore.get("cartId")?.value;

    const cart = await db.cart.findFirst({
      where: {
        ...(userId ? { userId } : { id: cartId }),
        closed: false,
      },
    });

    if (!cart) throw new Error("Cart not found.");

    await db.cart.delete({ where: { id: cart.id } });

    // Hapus cookie jika menggunakan cartId dari cookie
    if (!userId) {
      cookieStore.set("cartId", "", {
        path: "/",
        expires: new Date(0),
      });
    }

    revalidatePath("/");

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function deleteCartItem(
  input: z.infer<typeof deleteCartItemSchema>,
) {
  await connection();

  try {
    const [session, cookieStore] = await Promise.all([auth(), cookies()]);
    const userId = session?.user.id;
    const cartId = cookieStore.get("cartId")?.value;

    const cart = await db.cart.findFirst({
      where: {
        ...(userId ? { userId } : { id: cartId }),
        closed: false,
      },
    });

    if (!cart) throw new Error("Cart not found.");

    const currentItems = Array.isArray(cart.items) ? cart.items : [];
    const updatedItems = currentItems.filter(
      (item) => item.productId !== input.productId,
    );

    await db.cart.update({
      where: { id: cart.id },
      data: { items: updatedItems },
    });

    revalidatePath("/");

    return { data: updatedItems, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function deleteCartItems(
  input: z.infer<typeof deleteCartItemsSchema>,
) {
  await connection();

  try {
    const [session, cookieStore] = await Promise.all([auth(), cookies()]);
    const userId = session?.user.id;
    const cartId = cookieStore.get("cartId")?.value;

    const cart = await db.cart.findFirst({
      where: {
        ...(userId ? { userId } : { id: cartId }),
        closed: false,
      },
    });

    if (!cart) throw new Error("Cart not found.");

    const currentItems = Array.isArray(cart.items) ? cart.items : [];
    const updatedItems = currentItems.filter(
      (item) => !input.productIds.includes(item.productId),
    );

    await db.cart.update({
      where: { id: cart.id },
      data: { items: updatedItems },
    });

    revalidatePath("/");

    return { data: updatedItems, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}
