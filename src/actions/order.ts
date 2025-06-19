"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Order, Prisma, TStatusOrder, UserRole } from "@prisma/client";
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
      id: paketOrder.id, // Atau paketOrder.paket.id, tergantung kebutuhan ID unik di array
      name: paketOrder.paket.name,
      description: paketOrder.paket.description,
      price: paketOrder.paket.price, // Harga dasar dari paket
      image: paketOrder.paket.image,
      isVisible: paketOrder.paket.isVisible,
      rating: paketOrder.paket.rating,
      categoryId: paketOrder.paket.categoryId,
      category: paketOrder.paket.category,
      stores: paketOrder.paket.stores,
      quantity: paketOrder.quantity, // Kuantitas dari paketOrder
      priceOrder: paketOrder.priceOrder, // <--- EXPLICITLY MENAMBAHKAN priceOrder dari paketOrder
      createdAt: paketOrder.paket.createdAt, // <--- TAMBAH INI
      updatedAt: paketOrder.paket.updatedAt, // <--- TAMBAH INI
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

type GetAllOrdersParams = {
  page: number;
  perPage: number;
  sort: { id: string; desc: boolean }[];
  nameAdmin: string;
  status: TStatusOrder[]; // hasil dari split manual string "PENDING,FAILURE"
};

export async function getAllOrdersForSuperadmin({
  page,
  perPage,
  sort = [],
  nameAdmin = "",
  status = [],
}: GetAllOrdersParams) {
  try {
    const skip = (page - 1) * perPage;

    // Atur sorting
    const orderBy = sort.length
      ? sort.map(({ id, desc }) => ({
          [id]: desc ? "desc" : "asc",
        }))
      : [{ createdAt: "desc" }];

    // Filter dinamis
    const where: Prisma.OrderWhereInput = {
      ...(status.length > 0 && {
        status: {
          in: status,
        },
      }),
      ...(nameAdmin && {
        store: {
          admin: {
            name: {
              contains: nameAdmin,
              mode: "insensitive",
            },
          },
        },
      }),
    };

    // Ambil data dan total
    const [orders] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          user: true,
          store: {
            include: {
              admin: true,
            },
          },
          pakets: true,
        },
      }),
      db.order.count({ where }),
    ]);

    return {
      data: orders,
      error: null,
    };
  } catch (error) {
    console.error("Error getAllOrdersForSuperadmin:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

export async function getOrders() {
  try {
    const session = await auth();
    if (!session) throw new Error("Not Authorized");

    const role = session.user.role.name;
    const userId = session.user.id;

    let orders: Order[] = [];

    if (role === UserRole.SUPERADMIN) {
      // Superadmin bisa lihat semua order
      orders = await db.order.findMany({
        include: {
          store: {
            include: {
              admin: true,
            },
          },
          pakets: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === UserRole.ADMIN) {
      // Cari toko yang dikelola admin ini
      const store = await db.store.findFirst({
        where: { adminId: userId },
      });

      if (!store) throw new Error("Admin tidak mengelola toko manapun");

      orders = await db.order.findMany({
        where: {
          storeId: store.id,
        },
        include: {
          user: true,
          store: true,
          pakets: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      throw new Error("Unauthorized role");
    }

    return { data: orders, error: null };
  } catch (error) {
    console.error("Error getOrders:", error);
    return { data: null, error: getErrorMessage(error) };
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
          {
            userId: session?.user.id,
            status: TStatusOrder.FAILURE,
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
