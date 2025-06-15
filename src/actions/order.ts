"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { TStatusOrder } from "@prisma/client";
import { subHours } from "date-fns";
import { connection } from "next/server";
import { getErrorMessage } from "@/lib/handle-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/midtrans";

export async function getOrderLineItems(input: { orderId: string }) {
  try {
    const session = await auth();
    if (!session) redirect("/");
    if (!input.orderId) throw new Error("orderId diperlukan.");

    // 1. Ambil order beserta paketnya
    const order = await db.order.findUnique({
      where: { id: input.orderId },
      include: {
        pakets: {
          include: {
            paket: {
              include: {
                category: true,
                stores: true,
              },
            },
          },
        },
      },
    });

    if (!order) throw new Error("Order tidak ditemukan.");

    // 4. Format ulang item sebagai line items
    const lineItems = order.pakets.map((paketOrder) => ({
      ...paketOrder.paket,
      quantity: paketOrder.quantity,
    }));

    return {
      data: {
        lineItems,
        order,
        storeId: order.storeId,
      },
      error: null,
    };
  } catch (err) {
    console.error("Error getOrderLineItems:", err);
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function getCountOrder() {
  try {
    await connection();
    const session = await auth();
    if (!session) redirect("/");
    const countOrderUser = await db.order.count({
      where: {
        status: TStatusOrder.PENDING,
        userId: session.user.id,
      },
    });

    return { data: countOrderUser, error: null };
  } catch (err) {
    return { data: 0, error: getErrorMessage(err) };
  }
}

export async function getUnpaidOrderByStore(storeId: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not Authorized");

    const unpaidOrder = await db.order.findFirst({
      where: {
        userId: session.user.id,
        status: TStatusOrder.PENDING, // atau sesuaikan status dari Midtrans
        pakets: {
          some: {
            paket: {
              stores: {
                some: { id: storeId },
              },
            },
          },
        },
      },

      select: {
        id: true,
      },
    });

    return { data: unpaidOrder, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getUnpaidOrders(_isExpired?: boolean) {
  await connection();
  const now = new Date();
  const twentyFourHoursAgo = subHours(now, 24);
  try {
    const session = await auth();
    if (!session) redirect("/");

    const userId = session.user.id;

    // 🔄 Update otomatis semua order PENDING yang lewat 24 jam jadi EXPIRED
    await db.order.updateMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      data: {
        status: TStatusOrder.EXPIRE,
      },
    });

    // 🔍 Query kondisi sesuai filter
    let createdAtFilter: object | undefined = undefined;

    if (_isExpired === true) {
      createdAtFilter = { lt: twentyFourHoursAgo };
    } else if (_isExpired === false) {
      createdAtFilter = { gt: twentyFourHoursAgo };
    }

    const unpaidOrders = await db.order.findMany({
      where: {
        userId,
        status: TStatusOrder.PENDING, // status ini tetap PENDING karena EXPIRED sudah diupdate
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
      include: {
        pakets: {
          include: {
            paket: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return { data: unpaidOrders, error: null };
  } catch (error) {
    console.error("getUnpaidOrders error:", error);
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getHistoryOrder() {
  await connection();
  try {
    const session = await auth();
    if (!session) redirect("/");
    const orderHistory = await db.order.findMany({
      where: {
        OR: [
          {
            userId: session?.user.id,
            status: TStatusOrder.SETTLEMENT,
          },

          {
            userId: session?.user.id,
            status: TStatusOrder.EXPIRE,
          },
          {
            userId: session?.user.id,
            status: TStatusOrder.CANCEL,
          },
        ],
      },

      orderBy: [{ status: "asc" }, { createdAt: "desc" }],

      include: {
        pakets: {
          include: {
            paket: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return { data: orderHistory, error: null };
  } catch (error) {
    console.error("getHistoryOrder error:", error);
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function cancelTransactionOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session) redirect("/");

    await coreApi.transaction.cancel(orderId);

    const updateStatusOrder = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: TStatusOrder.CANCEL,
      },

      select: {
        id: true,
        status: true,
      },
    });

    revalidatePath("/invoice");
    return { data: updateStatusOrder, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: getErrorMessage(error) };
  }
}
