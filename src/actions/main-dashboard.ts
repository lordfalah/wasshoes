"use server";

import { subMonths, startOfMonth } from "date-fns";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { connection } from "next/server";
import { redis } from "@/lib/db_redis";
import { z } from "zod";

export async function getRevenueComparison() {
  await connection();
  const today = new Date();
  const startThis6Months = startOfMonth(subMonths(today, 5)); // ex: Jan
  const startPrev6Months = startOfMonth(subMonths(today, 11)); // ex: Jul last year

  try {
    const session = await auth();
    if (!session || session.user.role.name === UserRole.USER) {
      return {
        thisTotal: 0,
        prevTotal: 0,
        percentageChange: 0,
      };
    }

    const [this6Months, prev6Months] = await Promise.all([
      db.order.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: "SETTLEMENT",
          createdAt: {
            gte: startThis6Months,
            lte: today,
          },

          ...(session.user.role.name === UserRole.ADMIN && {
            storeId: session.user.storeId,
          }),
        },
      }),
      db.order.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: "SETTLEMENT",
          createdAt: {
            gte: startPrev6Months,
            lt: startThis6Months,
          },
          ...(session.user.role.name === UserRole.ADMIN && {
            storeId: session.user.storeId,
          }),
        },
      }),
    ]);

    const thisTotal = this6Months._sum.totalPrice ?? 0;
    const prevTotal = prev6Months._sum.totalPrice ?? 0;

    let percentageChange = 0;
    if (prevTotal > 0) {
      percentageChange = ((thisTotal - prevTotal) / prevTotal) * 100;
    } else if (thisTotal > 0) {
      percentageChange = 100;
    }

    return {
      thisTotal,
      prevTotal,
      percentageChange: Number(percentageChange.toFixed(1)), // misal: 12.5
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      thisTotal: 0,
      prevTotal: 0,
      percentageChange: 0,
    };
  }
}

export async function getTotalVisitors() {
  try {
    // 1. Ambil semua key pengunjung
    const allKeys = await redis.keys("visitors:*");

    // 2. Filter biar tidak masuk key seperti 'dedup:*'
    const visitorKeys = allKeys.filter((key) => key.startsWith("visitors:"));

    // 3. Ambil semua nilainya (asumsikan semuanya integer)
    const values = await Promise.all(
      visitorKeys.map((key) => redis.get<number>(key)),
    );

    // 4. Validasi dan jumlahkan
    const total = values.reduce((acc, value) => {
      const parsed = z.coerce.number().catch(0).parse(value); // fallback to 0
      return (acc ? acc : 0) + parsed;
    }, 0);

    return total;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 0;
  }
}

export async function getTotalOrders() {
  try {
    const session = await auth();
    if (!session || session.user.role.name === UserRole.USER) {
      return 0;
    }

    const total = await db.order.count({
      ...(session.user.role.name === UserRole.ADMIN && {
        where: { storeId: session.user.storeId },
      }),
    });

    return total;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 0;
  }
}

export async function getTotalPackage() {
  try {
    const session = await auth();
    if (!session) return 0;

    const isAdmin = session.user.role.name === UserRole.ADMIN;

    const total = await db.paket.count({
      where: isAdmin
        ? {
            stores: {
              some: {
                adminId: session.user.id,
              },
            },
          }
        : undefined, // superadmin → tidak filter
    });

    return total;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return 0;
  }
}
