import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req) => {
  try {
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

    const res = await db.user.findMany({
      include: {
        role: true,
      },

      omit: {
        password: true,
      },
    });

    return NextResponse.json(
      {
        status: "success",
        data: res,
        message: "GET users success",
      },
      { status: 200 },
    );
  } catch (error) {
    return PrismaErrorHandler.handlePrisma(error as never);
  }
}) as never;
