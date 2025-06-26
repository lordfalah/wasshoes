import { withAuthRole } from "@/lib/auth";
import { db } from "@/lib/db";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { SortOptionSchemaUser } from "@/lib/searchParams";
import { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

export const GET = withAuthRole(async (req) => {
  try {
    const searchParams = req.nextUrl.searchParams;

    const name = searchParams.get("name") || "";
    const roleParam = searchParams.get("role") || ""; // format: ADMIN,USER
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);
    const sortParam = searchParams.get("sort");

    const skip = (page - 1) * perPage;

    // Parsing role jadi array
    const roles = roleParam
      .split(",")
      .map((r) => r.trim())
      .filter((r) => !!r);

    let orderBy: Prisma.UserOrderByWithRelationInput[] = [];
    if (sortParam) {
      try {
        const parsed = JSON.parse(sortParam) as z.infer<
          typeof SortOptionSchemaUser
        >;
        orderBy = parsed.map((s): Prisma.UserOrderByWithRelationInput => {
          if (s.id === "role") {
            return { role: { name: s.desc ? "desc" : "asc" } };
          }
          return { [s.id]: s.desc ? "desc" : "asc" };
        });
      } catch {}
    }

    const whereConditions: Prisma.UserWhereInput[] = [];

    if (name) {
      whereConditions.push({
        name: {
          contains: name,
          mode: "insensitive",
        },
      });
    }

    if (roles.length > 0) {
      whereConditions.push({
        role: {
          name: {
            in: roles as UserRole[],
          },
        },
      });
    }

    const where: Prisma.UserWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          role: true,
        },
        orderBy,
        skip,
        take: perPage,
        omit: {
          password: true,
        },
      }),
      db.user.count({ where }),
    ]);
    return NextResponse.json(
      {
        status: "success",
        data: users,
        total,
        message: "GET users success",
      },
      { status: 200 },
    );
  } catch (error) {
    return PrismaErrorHandler.handlePrisma(error as never);
  }
});
