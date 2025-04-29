import { withAuth, withAuthRole } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { StoreSchema } from "@/schemas/store";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

export const GET = withAuth(async () => {
  try {
    const stores = await db.store.findMany({
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { status: "success", message: "Stores fetched", data: stores },
      { status: 200 },
    );
  } catch (error) {
    console.error("[STORE_GET]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const POST = withAuthRole(async (req) => {
  try {
    const body = await req.json();

    const { success, error, data } = StoreSchema.safeParse(body);

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const store = await db.store.create({
      data: {
        name: data.name,
        bannerStore: data.bannerStore as unknown as InputJsonValue[],
        userId: req.auth?.user.id as string,
      },
    });

    return NextResponse.json(
      { status: "success", message: "Store created", data: store },
      { status: 201 },
    );
  } catch (error) {
    console.error("[STORE_POST]", error);

    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
