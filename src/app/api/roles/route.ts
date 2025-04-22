import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { UserSchema } from "@/schemas";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req) => {
  if (req.auth?.user.role.name !== UserRole.SUPERADMIN) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Unauthorized access. You must be a SUPERADMIN to perform this action.",
        errors: null,
      },
      { status: 401 },
    );
  }

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

export const POST = withAuth(async (req) => {
  if (req.auth?.user.role.name !== UserRole.SUPERADMIN) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Unauthorized access. You must be a SUPERADMIN to perform this action.",
        errors: null,
      },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();

    const { success, error, data } = UserSchema.pick({ role: true }).safeParse(
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
          message: "Validation error",
          errors,
        },
        { status: 400 },
      );
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
