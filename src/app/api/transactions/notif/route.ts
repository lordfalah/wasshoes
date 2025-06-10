import { NextResponse } from "next/server";
import { coreApi } from "@/lib/midtrans";
import { db } from "@/lib/db";
import { TStatusOrder } from "@prisma/client";
import crypto from "node:crypto";

const SERVER_KEY = process.env.NEXT_PUBLIC_MIDTRANS_SERVER_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { order_id, status_code, gross_amount, signature_key } = body;

    // Buat ulang signature_key untuk validasi
    const hash = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + SERVER_KEY)
      .digest("hex");

    if (hash !== signature_key) {
      console.warn("🚨 Invalid signature from Midtrans");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 },
      );
    }
    // Ambil status terbaru dari Midtrans
    const midtransStatus = await coreApi.transaction.status(order_id);
    const status = midtransStatus.transaction_status.toLowerCase();

    // Cek apakah order memang ada di database
    const order = await db.order.findUnique({
      where: { id: order_id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order tidak ditemukan" },
        { status: 404 },
      );
    }

    // Mapping status Midtrans ke sistem lokal kamu (TStatusOrder)
    let newStatus: TStatusOrder | null = null;

    switch (status) {
      case "settlement":
        newStatus = TStatusOrder.SETTLEMENT;
        break;
      case "pending":
        newStatus = TStatusOrder.PENDING;
        break;
      case "expire":
        newStatus = TStatusOrder.EXPIRE;
        break;
      case "cancel":
        newStatus = TStatusOrder.CANCEL;
        break;
      case "deny":
        newStatus = TStatusOrder.DENY;
        break;
      default:
        // status lain seperti refund, chargeback, dll
        newStatus = TStatusOrder.FAILURE;
    }

    // Update jika status berubah
    if (order.status !== newStatus) {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
        },
      });
    }

    return NextResponse.json(
      {
        status: "success",
        message: "transaction status updated",
        data: midtransStatus,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Notifikasi Midtrans Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
