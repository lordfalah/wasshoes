import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import snap from "@/lib/midtrans";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import {
  adminCheckoutSchemaServer,
  userCheckoutSchemaServer,
} from "@/schemas/checkout.schema";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

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
    };
  });

  return { total, item_details };
}

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();

    if (req.auth?.user.role.name === UserRole.ADMIN) {
      const { success, data, error } =
        adminCheckoutSchemaServer.safeParse(body);
      if (!success) return PrismaErrorHandler.handleZodCompact(error);

      const { item_details } = await getTotalPriceAndItemDetails(data.pakets);

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: data.orderId, // ID order unik
          gross_amount: data.pakets.reduce((acc, item) => {
            return acc + item.priceOrder * item.quantity;
          }, 0),
        },
        customer_details: {
          first_name: data.customer.first_name,
          last_name: data.customer.last_name,
          email: data.customer.email || "anonymous@example.com",
          phone: data.customer.phone || "081000000000",
        },

        item_details,
      });

      const order = await db.order.create({
        data: {
          totalPrice: data.pakets.reduce((acc, item) => {
            return acc + item.priceOrder * item.quantity;
          }, 0),
          paymentToken: transaction.token,
          redirectUrl: transaction.redirect_url,
        },
      });

      const paketOrder = await db.paketOrder.createManyAndReturn({
        data: data.pakets.map((paket) => ({
          orderId: order.id,
          paketId: paket.paketId,
          priceOrder: paket.priceOrder,
          quantity: paket.quantity,
          shoesImages: paket.shoesImages || [],
        })),
      });

      return NextResponse.json(
        {
          status: "success",
          message: "transaction created",
          data: paketOrder,
        },
        { status: 201 },
      );
    }

    if (req.auth?.user.role.name === UserRole.USER) {
      const { success, data, error } = userCheckoutSchemaServer.safeParse(body);
      if (!success) return PrismaErrorHandler.handleZodCompact(error);

      const { total, item_details } = await getTotalPriceAndItemDetails(
        data.pakets,
      );

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: data.orderId, // ID order unik dari sistem kamu
          gross_amount: total,
        },
        customer_details: {
          first_name: req.auth.user.name?.split(" ")[0] || "User",
          last_name: req.auth.user.name?.split(" ")[1] || "",
          email: req.auth.user.email || "user@example.com",
          phone: "081234567890", // jika tidak ada simpan placeholder
        },

        item_details,
      });

      const order = await db.order.create({
        data: {
          paymentToken: transaction.token,
          redirectUrl: transaction.redirect_url,
          totalPrice: total,
        },
      });

      const paketOrder = await db.paketOrder.createManyAndReturn({
        data: data.pakets.map((paket) => ({
          orderId: order.id,
          paketId: paket.paketId,
          priceOrder: 0,
          quantity: paket.quantity,
          shoesImages: paket.shoesImages || [],
        })),
      });

      return NextResponse.json(
        {
          status: "success",
          message: "transaction created",
          data: paketOrder,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { status: "fail", message: "transaction fail", data: null },
      { status: 400 },
    );
  } catch (error) {
    console.error("[TRANSACTION_POST]", error);

    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
