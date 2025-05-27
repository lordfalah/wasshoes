import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { PackageSchemaServer } from "@/schemas/package.schema";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req) => {
  try {
    const packageId = (await req.params).packageId;

    const paket = await db.paket.findUnique({
      where: { id: packageId },
      include: {
        category: true,
        stores: true,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Detail paket",
      data: paket,
    });
  } catch (error) {
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const PATCH = withAuth(async (req) => {
  try {
    const packageId = (await req.params).packageId;
    if (!packageId) {
      return NextResponse.json(
        { status: "error", message: "Package ID is required", data: null },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { success, error, data } = PackageSchemaServer.safeParse(body);

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const paket = await db.paket.update({
      where: { id: packageId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image[0],
        stores:
          Array.isArray(data.nameStore) && data.nameStore.length > 0
            ? {
                set: data.nameStore
                  .filter((name) => name.trim() !== "")
                  .map((name) => ({ name })),
              }
            : undefined,
      },
    });

    return NextResponse.json(
      { status: "success", message: "Package Update", data: paket },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PAKET_PUT]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

export const DELETE = withAuth(async (req) => {
  try {
    const packageId = (await req.params).packageId;
    if (!packageId) {
      return NextResponse.json(
        { status: "error", message: "Package ID is required", data: null },
        { status: 400 },
      );
    }

    const deleted = await db.paket.delete({
      where: { id: packageId },
    });

    return NextResponse.json(
      { status: "success", message: "Package deleted", data: deleted },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PAKET_DELETE]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
