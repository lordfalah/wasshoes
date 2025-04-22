import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { NextResponse } from "next/server";
import { NextRequestExt, withAuth } from "@/lib/auth";
import { UserSchema } from "@/schemas";

export const PATCH = withAuth(async (req: NextRequestExt) => {
  const session = req.auth?.user;
  const userId = (await req.params).userId;

  if (!session || session.role.name !== "SUPERADMIN") {
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

  const body = await req.json();
  const { success, data, error } = UserSchema.pick({ role: true }).safeParse(
    body,
  );

  if (!success) {
    const errors = error.issues.reduce(
      (acc, issue) => {
        acc[issue.path.join(".")] = issue.message;
        return acc;
      },
      {} as Record<string, string>,
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Validation failed",
        errors,
      },
      { status: 400 },
    );
  }

  try {
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
