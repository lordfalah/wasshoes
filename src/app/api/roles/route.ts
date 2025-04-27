import { withAuthRole } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { UserSchema } from "@/schemas";
import { NextResponse } from "next/server";

export const GET = withAuthRole(async () => {
  try {
    const res = await db.role.findMany();

    return NextResponse.json(
      {
        status: "success",
        data: res,
        message: "get data roles",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching roles:", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
}) as never;

export const POST = withAuthRole(async (req) => {
  try {
    const body = await req.json();

    const { success, error, data } = UserSchema.pick({ role: true }).safeParse(
      body,
    );

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const newRole = await db.role.create({
      data: { name: data.role },
    });

    return NextResponse.json(
      {
        status: "success",
        data: newRole,
        message: "Role created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating role:", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
}) as never;
