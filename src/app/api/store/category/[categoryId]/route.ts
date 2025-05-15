import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { CategorySchema } from "@/schemas/category.schema";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req) => {
  try {
    const categoryId = (await req.params).categoryId;

    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    return NextResponse.json({
      status: "success",
      message: "Detail Category",
      data: category,
    });
  } catch (error) {
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const PATCH = withAuth(async (req) => {
  try {
    const categoryId = (await req.params).categoryId;

    const body = await req.json();
    const { success, error, data } = CategorySchema.safeParse(body);

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const updated = await db.category.update({
      where: { id: categoryId },
      data: {
        ...data,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Kategori diperbarui",
      data: updated,
    });
  } catch (error) {
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const DELETE = withAuth(async (req) => {
  try {
    const categoryId = (await req.params).categoryId;
    console.log({ categoryId });

    const category = await db.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      status: "success",
      message: "Kategori dihapus",
      data: category,
    });
  } catch (error) {
    console.log(error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
