import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import snap from "@/lib/midtrans";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { v4 as uuidv4 } from "uuid";
import { userCheckoutSchemaServer } from "@/schemas/checkout.schema";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTotalPriceAndItemDetails } from "@/actions/product";

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();

    // if (req.auth?.user.role.name === UserRole.ADMIN) {
    //   const { success, data, error } =
    //     adminCheckoutSchemaServer.safeParse(body);
    //   if (!success) return PrismaErrorHandler.handleZodCompact(error);

    //   const { item_details } = await getTotalPriceAndItemDetails(data.pakets);

    //   const transaction = await snap.createTransaction({
    //     transaction_details: {
    //       order_id: data.orderId, // ID order unik
    //       gross_amount: data.pakets.reduce((acc, item) => {
    //         return acc + (item.priceOrder ? item.priceOrder : item.) * item.quantity;
    //       }, 0),
    //     },
    //     customer_details: {
    //       first_name: data.customer.first_name,
    //       last_name: data.customer.last_name,
    //       email: data.customer.email || "anonymous@example.com",
    //       phone: data.customer.phone || "081000000000",
    //     },

    //     item_details,
    //   });

    //   const order = await db.order.create({
    //     data: {
    //       totalPrice: data.pakets.reduce((acc, item) => {
    //         return acc + item.priceOrder * item.quantity;
    //       }, 0),
    //       paymentToken: transaction.token,
    //       redirectUrl: transaction.redirect_url,
    //       pakets: [],

    //     },
    //   });

    //   const paketOrder = await db.paketOrder.create({
    //     data: {
    //      orderId: "12",
    //     }
    //   })

    //   return NextResponse.json(
    //     {
    //       status: "success",
    //       message: "transaction created",
    //       data: null,
    //     },
    //     { status: 201 },
    //   );
    // }

    const cookieStore = await cookies();
    const cartIdFromCookie = cookieStore.get("cartId")?.value;

    if (req.auth?.user.role.name === UserRole.USER) {
      const { success, data, error } = userCheckoutSchemaServer.safeParse(body);
      if (!success) return PrismaErrorHandler.handleZodCompact(error);

      // Cek apakah sudah ada order yang belum dibayar
      const existingOrder = await db.order.findFirst({
        where: {
          userId: req?.auth?.user.id as string,
          status: "PENDING",
          storeId: data.storeId, // ✅ hanya jika pending di toko yg sama
        },
      });

      // Kalau ada, return langsung redirect ke pembayaran lama
      if (existingOrder) {
        return NextResponse.json(
          {
            status: "existing",
            message: "Masih ada transaksi yang belum diselesaikan.",
            data: {
              orderId: existingOrder.id,
              redirectUrl: existingOrder.redirectUrl,
            },
          },
          { status: 200 },
        );
      }

      const uuidOrderId = uuidv4();

      const { total, item_details } = await getTotalPriceAndItemDetails(
        data.pakets,
      );

      await db.user.update({
        where: {
          id: req.auth.user.id,
        },
        data: {
          firstName: data.customer.first_name,
          lastName: data.customer.last_name,
          email: data.customer.email,
          phone: data.customer.phone,
        },
      });

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: uuidOrderId, // ID order unik
          gross_amount: total,
        },
        customer_details: {
          first_name: data.customer.first_name,
          last_name: data.customer.last_name,
          email: data.customer.email || "anonymous@example.com",
          phone: data.customer.phone || "081000000000",
        },

        item_details,
      });

      // Buat order (hanya satu kali)
      const order = await db.order.create({
        data: {
          id: uuidOrderId,
          userId: req.auth.user.id as string,
          totalPrice: total,
          paymentMethod: data.paymentMethod,
          paymentToken: transaction.token,
          redirectUrl: transaction.redirect_url,
          shoesImages: data.shoesImages,

          pakets: {
            create: data.pakets.map((paket) => ({
              paketId: paket.paketId,
              quantity: paket.quantity,
              priceOrder: paket.price,
            })),
          },

          storeId: data.storeId,
        },
      });

      // update cart to close if success
      await db.cart.updateMany({
        where: {
          OR: [
            { id: cartIdFromCookie, closed: false },
            { userId: req.auth?.user.id, closed: false },
          ],
        },
        data: {
          closed: true,
        },
      });

      return NextResponse.json(
        {
          status: "success",
          message: "transaction created",
          data: order,
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
