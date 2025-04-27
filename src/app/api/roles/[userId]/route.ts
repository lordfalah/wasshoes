import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { NextResponse } from "next/server";
import { NextRequestExt, withAuth } from "@/lib/auth";
import { UserSchema } from "@/schemas";
import { UserRole } from "@prisma/client";

export const PATCH = withAuth(async (req: NextRequestExt) => {
  const userId = (await req.params).userId;

  if (req.auth?.user.role.name !== UserRole.SUPERADMIN) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unauthorized. Only SUPERADMIN can update user role.",
        errors: null,
      },
      { status: 401 },
    );
  }

  if (!userId) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid user ID.",
        errors: null,
      },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const { success, data, error } = UserSchema.pick({ role: true }).safeParse(
      body,
    );

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }
    const role = await db.role.findUnique({
      where: {
        name: data.role,
      },
    });

    if (!role) {
      return NextResponse.json(
        {
          status: "error",
          message: "Role not found.",
          errors: null,
        },
        { status: 404 },
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      omit: {
        password: true,
      },
      data: {
        role: {
          connect: {
            id: role.id,
          },
        },
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json(
      {
        status: "success",
        message: "User role updated successfully.",
        data: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update user role error:", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
}) as never;
