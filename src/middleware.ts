import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";
import { NextFetchEvent, NextResponse, userAgent } from "next/server";
import { ipAddress } from "@vercel/functions";
import { redis } from "./lib/db_redis";

const { auth } = NextAuth(authConfig);

export default auth((req, context) => {
  // validate visitor
  if (process.env.NEXT_PUBLIC_APP_ENV?.toUpperCase() === "PRODUCTION") {
    const event = context as NextFetchEvent;
    const ip = ipAddress(req) || "unknown";

    const { device } = userAgent(req);

    const viewport = device.type === "mobile" ? "mobile" : "desktop";

    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    event.waitUntil(
      (async () => {
        try {
          const hashBuffer = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(ip),
          );
          const ipHash = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const dedupKey = `dedup:${date}:${viewport}:${ipHash}`;
          const visitorKey = `visitors:${date}:${viewport}`;

          const isNew = await redis.set(dedupKey, true, {
            nx: true,
            ex: 60 * 60 * 24, // expire in 1 day
          });

          if (isNew) {
            await redis.incr(visitorKey);
          }
        } catch (err) {
          console.error("Tracking error:", err);
        }
      })(),
    );
    return NextResponse.next();
  }

  // validate auth

  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // ⛔️ Bypass middleware untuk endpoint ini
  if (nextUrl.pathname === "/api/uploadthing") {
    return NextResponse.next();
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl),
    );
  }

  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
