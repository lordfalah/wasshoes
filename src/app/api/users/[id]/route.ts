import { NextRequestExt, withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { UserSchema } from "@/schemas";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async (req: NextRequestExt) => {
  const id = (await req?.params).id;

  if (!id) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid Request",
        errors: null,
      },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const { success, error, data } = UserSchema.pick({ url: true }).safeParse(
      body,
    );

    if (!success) {
      return PrismaErrorHandler.handleZodCompact(error);
    }

    const res = await db.user.update({
      where: {
        id,
      },
      data: {
        image: data.url,
      },
    });

    return NextResponse.json(
      {
        status: "success",
        data: res,
        message: "Update profile success",
      },
      { status: 201 },
    );
  } catch (error) {
    return PrismaErrorHandler.handlePrisma(error as never);
  }
}) as never;
