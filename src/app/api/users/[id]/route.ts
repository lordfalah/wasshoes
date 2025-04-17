import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const id = (await params).id;

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
    const { url } = (await req.json()) as { url: string };

    if (!url) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid url",
          errors: {
            image: "Must have url",
          },
        },
        { status: 400 },
      );
    }

    const res = await db.user.update({
      where: {
        id,
      },
      data: {
        image: url,
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
};
