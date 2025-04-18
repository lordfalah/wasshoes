export const revalidate = 60;

import { auth } from "@/auth";
import { redis } from "@/lib/db_redis";
import PrismaErrorHandler from "@/lib/PrismaErrorHandler";
import { NextResponse } from "next/server";

const getLastNDates = (n: number): string[] => {
  const dates: string[] = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates.reverse();
};

export const GET = auth(async (req) => {
  if (!req.auth || !req.auth?.user) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid Request",
        errors: null,
      },
      { status: 401 },
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const range = searchParams.get("range") || "7days";

  const rangeMap: Record<string, number> = {
    "7days": 7,
    "30days": 30,
    "3months": 90,
  };

  const days = rangeMap[range] || 7;
  const dates = getLastNDates(days);

  // Return dummy if not production
  if (process.env.NEXT_PUBLIC_APP_ENV !== "PRODUCTION") {
    const dummy = dates.map((date) => ({
      date,
      mobile: Math.floor(Math.random() * 10),
      desktop: Math.floor(Math.random() * 10),
    }));

    return NextResponse.json(
      {
        status: "success",
        data: dummy,
        message: "get data visitor",
      },
      { status: 200 },
    );
  }

  try {
    const results = await Promise.all(
      dates.map(async (date) => {
        const mobile =
          +((await redis.get(`visitors:${date}:mobile`)) as number) || 0;
        const desktop =
          +((await redis.get(`visitors:${date}:desktop`)) as number) || 0;

        return { date, mobile, desktop };
      }),
    );

    return NextResponse.json(
      {
        status: "success",
        data: results,
        message: "get data visitor",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching visitor stats:", error);
    return PrismaErrorHandler.handlePrisma(error as never);
  }
}) as never;
