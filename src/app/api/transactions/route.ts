import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import snap from "@/lib/midtrans";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { v4 as uuidv4 } from "uuid";
import {
  adminCheckoutSchemaServer,
  userCheckoutSchemaServer,
} from "@/schemas/checkout.schema";
import { Order, TPaymentMethod, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTotalPriceAndItemDetails } from "@/actions/product";
import { update } from "@/auth";

export const POST = withAuth(async (req) => {
  try {
    const uuidOrderId = uuidv4();
    const body = await req.json();
    const cookieStore = await cookies();
    const cartIdFromCookie = cookieStore.get("cartId")?.value;

    if (req.auth?.user.role.name === UserRole.ADMIN) {
      const { success, data, error } =
        adminCheckoutSchemaServer.safeParse(body);
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

      const { total, item_details } = await getTotalPriceAndItemDetails(
        data.pakets,
        true, // karena admin
      );

      console.log({ total });

      let order: Order | undefined = undefined;

      if (data.paymentMethod === TPaymentMethod.AUTO) {
        const transaction = await snap.createTransaction({
          transaction_details: {
            order_id: uuidOrderId, // ID order unik
            gross_amount: total,
          },
          customer_details: {
            first_name: data.customer.first_name,
            last_name: data.customer.last_name,
            phone: data.customer.phone,
            email: data.customer.email,
          },

          item_details,
        });

        // Buat order (hanya satu kali)
        order = await db.order.create({
          data: {
            id: uuidOrderId,
            userId: req.auth.user.id as string,
            totalPrice: total,
            paymentMethod: data.paymentMethod,
            paymentToken: transaction.token,
            redirectUrl: transaction.redirect_url,
            shoesImages: data.shoesImages,
            informationCustomer: {
              first_name: data.customer.first_name,
              last_name: data.customer.last_name,
              phone: data.customer.phone,
              email: data.customer.email,
              name: data.customer.name,
            },

            pakets: {
              create: data.pakets.map((paket) => ({
                paketId: paket.paketId,
                quantity: paket.quantity,
                priceOrder: paket.priceOrder ?? null,
              })),
            },

            storeId: data.storeId,
          },
        });
      } else if (data.paymentMethod === TPaymentMethod.MANUAL) {
        order = await db.order.create({
          data: {
            id: uuidOrderId,
            userId: req.auth.user.id as string,
            totalPrice: total,
            paymentMethod: data.paymentMethod,
            paymentToken: null,
            redirectUrl: null,
            shoesImages: data.shoesImages,
            informationCustomer: {
              first_name: data.customer.first_name,
              last_name: data.customer.last_name,
              phone: data.customer.phone,
              email: data.customer.email,
              name: data.customer.name,
            },

            pakets: {
              create: data.pakets.map((paket) => ({
                paketId: paket.paketId,
                quantity: paket.quantity,
                priceOrder: paket.priceOrder ?? null,
              })),
            },

            storeId: data.storeId,
          },
        });
      }

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

      const { total, item_details } = await getTotalPriceAndItemDetails(
        data.pakets,
        false,
      );

      // Cek apakah profil belum lengkap (misalnya nama depan atau nomor HP kosong/null)
      const isProfileIncomplete =
        !req.auth.user?.firstName ||
        !req.auth.user?.phone ||
        !req.auth.user?.lastName;

      // Jika profil belum lengkap, update user dari form yang dikirim frontend
      if (isProfileIncomplete) {
        await db.user.update({
          where: { id: req.auth.user.id },
          data: {
            firstName: data.customer.first_name,
            lastName: data.customer.last_name,
            phone: data.customer.phone,
          },
        });
        await update({
          user: {
            firstName: data.customer.first_name,
            lastName: data.customer.last_name,
            phone: data.customer.phone,
          },
        });
      }

      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: uuidOrderId, // ID order unik
          gross_amount: total,
        },
        customer_details: {
          first_name: isProfileIncomplete
            ? data.customer.first_name
            : req.auth.user.firstName,
          last_name: isProfileIncomplete
            ? data.customer.last_name
            : req.auth.user.lastName,
          phone: isProfileIncomplete
            ? data.customer.phone
            : req.auth.user.phone,
          email: data.customer.email ?? req.auth.user.email,
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
      { status: "fail", message: "Not Authorized", data: null },
      { status: 400 },
    );
  } catch (error) {
    console.error("[TRANSACTION_POST]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
