import { withAuthRole } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { CategorySchema } from "@/schemas/category.schema";
import { NextResponse } from "next/server";

export const POST = withAuthRole(async (req) => {
  try {
    const body = await req.json();
    const { success, error, data } = CategorySchema.safeParse(body);

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }
    const category = await db.category.create({
      data: {
        ...data,
      },
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Kategori berhasil dibuat",
        data: category,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CATEGORY_POST]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const GET = withAuthRole(async () => {
  try {
    const categories = await db.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        pakets: true,
      },
    });

    return NextResponse.json(
      { status: "success", message: "Daftar kategori", data: categories },
      { status: 200 },
    );
  } catch (error) {
    console.error("[CATEGORY_GET]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
