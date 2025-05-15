import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { PackageSchemaServer } from "@/schemas/package.schema";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const { success, error, data } = PackageSchemaServer.safeParse(body);

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const paket = await db.paket.create({
      data: {
        ...data,
        image: data.image[0] as unknown as InputJsonValue,
        price: data.price,
        description: data.description,
        name: data.name,
        stores: {
          connect: {
            name: data.nameStore ? data.nameStore : undefined,
          },
        },
      },
    });

    return NextResponse.json(
      { status: "success", message: "Package created", data: paket },
      { status: 201 },
    );
  } catch (error) {
    console.error("[PAKET_POST]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});

// READ ALL
export const GET = withAuth(async () => {
  try {
    const pakets = await db.paket.findMany({
      include: {
        category: true,
        stores: true,
      },
    });

    return NextResponse.json(
      { status: "success", message: "Pakets fetched", data: pakets },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PAKET_GET]", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
