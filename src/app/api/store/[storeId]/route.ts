import { withAuthRole } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { StoreSchemaServer } from "@/schemas/store.schema";
import { NextResponse } from "next/server";

export const GET = withAuthRole(async (req) => {
  try {
    const storeId = (await req.params).storeId;
    if (!storeId) {
      return NextResponse.json(
        { status: "error", message: "Store ID is required", data: null },
        { status: 400 },
      );
    }

    const store = await db.store.findFirst({
      where: { id: storeId },
    });

    return NextResponse.json(
      { status: "success", message: "Store get detail", data: store },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[STORE_GET_DETAIL]`, error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const PATCH = withAuthRole(async (req) => {
  try {
    const storeId = (await req.params).storeId;
    if (!storeId) {
      return NextResponse.json(
        { status: "error", message: "Store ID is required", data: null },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { success, error, data } = StoreSchemaServer.safeParse(body);
    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const updatedStore = await db.store.update({
      where: { id: storeId },
      data: {
        ...data,
        bannerImgs: data.bannerImgs,
      },
    });

    return NextResponse.json(
      { status: "success", message: "Store updated", data: updatedStore },
      { status: 200 },
    );
  } catch (error) {
    console.error("[STORE_PATCH]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const DELETE = withAuthRole(async (req) => {
  try {
    const storeId = (await req.params).storeId;
    if (!storeId) {
      return NextResponse.json(
        { status: "error", message: "Store ID is required", data: null },
        { status: 400 },
      );
    }

    await db.store.delete({
      where: { id: storeId },
    });

    return NextResponse.json(
      { status: "success", message: "Store deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    console.error("[STORE_DELETE]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
