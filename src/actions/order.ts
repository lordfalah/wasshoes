"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { TStatusOrder } from "@prisma/client";
import { coreApi } from "@/lib/midtrans";
import { subHours } from "date-fns";
import { connection } from "next/server";

export async function getOrderLineItems(input: { orderId: string }) {
  try {
    const session = await auth();
    if (!session) throw new Error("Not Authorized");

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

    // 2. Cek status pembayaran dari Midtrans
    const transactionMidtrans = await coreApi.transaction.status(input.orderId);
    const isPaid =
      transactionMidtrans.transaction_status.toLowerCase() ===
      TStatusOrder.SETTLEMENT.toLowerCase();

    // 3. Jika sudah dibayar tapi status belum diperbarui, update
    if (isPaid && order.status !== TStatusOrder.SETTLEMENT) {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: TStatusOrder.SETTLEMENT,
        },
      });
    }

    // 4. Format ulang item sebagai line items
    const lineItems = order.pakets.map((paketOrder) => ({
      ...paketOrder.paket,
      quantity: paketOrder.quantity,
    }));

    return { lineItems, storeId: order.storeId };
  } catch (err) {
    console.error("Error getOrderLineItems:", err);
    return { lineItems: null, storeId: null };
  }
}

export async function getCountOrder() {
  try {
    await connection();
    const session = await auth();
    if (!session) return 0;
    const countOrderUser = await db.order.count({
      where: {
        status: TStatusOrder.PENDING,
      },
    });

    return countOrderUser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 0;
  }
}

export async function getUnpaidOrderByStore(userId: string, storeId: string) {
  try {
    const unpaidOrder = await db.order.findFirst({
      where: {
        userId,
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

    return unpaidOrder;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}

export async function getUnpaidOrders(_isExpired?: boolean) {
  try {
    const session = await auth();
    if (!session) return null;

    const userId = session.user.id;
    const now = new Date();
    const twentyFourHoursAgo = subHours(now, 24);

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

    return unpaidOrders;
  } catch (error) {
    console.error("getUnpaidOrders error:", error);
    return null;
  }
}

export async function getHistoryOrder() {
  try {
    const session = await auth();

    const orderHistory = await db.order.findMany({
      where: {
        userId: session?.user.id,
        status: TStatusOrder.SETTLEMENT,
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

    return orderHistory;
  } catch (error) {
    console.error("getOrderHistory error:", error);
    return null;
  }
}

export async function getUnpaidOrderAndClosedCart() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) return { orders: [] };

    const userId = session.user.id;

    // 1. Ambil order yang masih pending (belum dibayar)
    const orders = await db.order.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      include: {
        pakets: {
          include: {
            paket: true,
          },
        },
      },
    });

    return { orders };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return { orders: [] };
  }
}
