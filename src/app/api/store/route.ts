import { withAuthRole } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { StoreSchemaServer } from "@/schemas/store.schema";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

export const GET = withAuthRole(async () => {
  try {
    const stores = await db.store.findMany({
      include: {
        users: {
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

    const { success, error, data } = StoreSchemaServer.safeParse(body);

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const store = await db.store.create({
      data: {
        name: data.name,
        bannerImgs: data.bannerImgs as unknown as InputJsonValue[],
        description: data.description,
        mapEmbed: data.mapEmbed,
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
