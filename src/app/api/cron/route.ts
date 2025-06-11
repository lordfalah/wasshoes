import { db } from "@/lib/db";
import { getErrorMessage } from "@/lib/handle-error";
import { TStatusOrder } from "@prisma/client";
import { subHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        {
          status: "failed",
          message: "Unauthorized",
          data: false,
        },
        {
          status: 401,
        },
      );
    }

    const now = new Date();
    const twentyFourHoursAgo = subHours(now, 24);

    // 🔄 Update order PENDING yang sudah 24 jam menjadi EXPIRE
    const updated = await db.order.updateMany({
      where: {
        status: TStatusOrder.PENDING,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
      data: {
        status: TStatusOrder.EXPIRE,
      },
    });

    return NextResponse.json(
      {
        status: "success",
        message: `${updated.count} order expired updated`,
        data: true,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", message: getErrorMessage(err) },
      { status: 500 },
    );
  }
}
