"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  TLaundryStatus,
  Order,
  Prisma,
  TPaymentMethod,
  TStatusOrder,
  UserRole,
  TPriority,
} from "@prisma/client";
import { subHours } from "date-fns";
import { connection } from "next/server";
import { getErrorMessage } from "@/lib/handle-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { coreApi } from "@/lib/midtrans";
import { orderSchema } from "@/schemas/order.schema";
import { GetOrderSchema } from "@/lib/search-params/search-order";

export async function getOrderLineItems(input: { orderId: string }) {
  try {
    const session = await auth();
    if (!session) redirect("/");
    if (!input.orderId) throw new Error("orderId diperlukan.");

    // 1. Ambil order beserta paketnya
    const order = await db.order.findUnique({
      where: { id: input.orderId, paymentMethod: TPaymentMethod.AUTO },
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

export async function getAllOrdersForSuperadmin(input: GetOrderSchema) {
  try {
    const { page, perPage, sort, customer, status, createdAt } = input;

    const skip = (page - 1) * perPage;

    const orderBy = sort.map(({ id, desc }) => {
      if (id === "store") {
        return {
          store: {
            name: (desc ? "desc" : "asc") as Prisma.SortOrder,
          },
        };
      }

      if (id === ("headStore" as string)) {
        return {
          store: {
            admin: {
              name: (desc ? "desc" : "asc") as Prisma.SortOrder,
            },
          },
        };
      }

      return {
        [id]: desc ? "desc" : "asc",
      };
    });

    const where: Prisma.OrderWhereInput = {
      ...(customer && {
        OR: [
          {
            informationCustomer: {
              path: ["first_name"],
              string_contains: customer,
              mode: "insensitive",
            },
          },
          {
            informationCustomer: {
              path: ["last_name"],
              string_contains: customer,
              mode: "insensitive",
            },
          },
          {
            user: {
              OR: [
                { name: { contains: customer, mode: "insensitive" } },
                { firstName: { contains: customer, mode: "insensitive" } },
                { lastName: { contains: customer, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),

      ...(status.length > 0 && {
        status: {
          in: status,
        },
      }),

      ...(createdAt.length === 2 && {
        createdAt: {
          gte: new Date(createdAt[0]),
          lte: new Date(createdAt[1]),
        },
      }),
    };

    const [orders, total] = await Promise.all([
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
      total,
      error: null,
    };
  } catch (error) {
    console.error("Error getAllOrdersForSuperadmin:", error);
    return {
      data: null,
      total: 0,
      error: getErrorMessage(error),
    };
  }
}

export async function getAllOrdersForAdmin(input: GetOrderSchema) {
  try {
    const session = await auth();
    if (!session?.user.storeId) throw new Error("Store id is required");

    const { page, perPage, sort, customer, status, createdAt } = input;

    const skip = (page - 1) * perPage;

    const orderBy = sort.length
      ? sort.map(({ id, desc }) => ({ [id]: desc ? "desc" : "asc" }))
      : [{ createdAt: "desc" }];

    // Filter pencarian namaUser
    const nameFilter: Prisma.OrderWhereInput[] = customer
      ? [
          {
            user: {
              name: { contains: customer, mode: "insensitive" },
            },
          },

          {
            informationCustomer: {
              path: ["name"],
              string_contains: customer,
              mode: "insensitive",
            },
          },
        ]
      : [];

    const where: Prisma.OrderWhereInput = {
      storeId: session.user.storeId,
      ...(status.length > 0 && {
        status: {
          in: status,
        },
      }),
      ...(nameFilter.length > 0 && {
        OR: nameFilter,
      }),

      ...(createdAt.length === 2 && {
        createdAt: {
          gte: new Date(createdAt[0]),
          lte: new Date(createdAt[1]),
        },
      }),
    };

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          user: true,
          store: true,
          pakets: {
            include: {
              paket: true,
            },
          },
        },
      }),
      db.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      error: null,
    };
  } catch (error) {
    console.error("Error getAllOrdersForAdmin:", error);
    return {
      data: null,
      total: 0,
      error: getErrorMessage(error),
    };
  }
}

export async function updateStatusLaundry(status: TLaundryStatus, id: string) {
  try {
    const { success, error, data } = orderSchema.safeParse({
      statusLaundry: status,
    });

    if (!success) {
      return { data: null, error: getErrorMessage(error) };
    }

    const updateStatus = await db.order.update({
      where: {
        id,
      },

      data: {
        laundryStatus: data.statusLaundry,
      },

      select: {
        laundryStatus: true,
      },
    });

    return { data: updateStatus, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
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

export async function updateStatusOrder({
  orderId,
  statusOrder,
}: {
  orderId: string;
  statusOrder: TStatusOrder;
}) {
  try {
    const order = await db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: statusOrder,
      },

      select: {
        id: true,
        status: true,
      },
    });

    revalidatePath("/invoice");
    return { data: order, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateOrders({
  ids,
  priority,
  laundryStatus,
}: {
  ids: string[];
  laundryStatus?: TLaundryStatus;
  priority?: TPriority;
}) {
  await connection();

  try {
    const orders = await db.order.updateManyAndReturn({
      where: {
        id: { in: ids },
      },

      data: {
        priority,
        laundryStatus,
      },
    });

    revalidatePath("/dashboard");
    return {
      data: orders,
      error: null,
    };
  } catch (error) {
    console.log(error);
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteOrders({ ids }: { ids: string[] }) {
  await connection();

  try {
    const orders = await db.order.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    revalidatePath("/dashboard");
    return {
      data: orders,
      error: null,
    };
  } catch (error) {
    console.log(error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
