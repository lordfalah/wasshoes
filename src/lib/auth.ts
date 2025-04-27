import { auth } from "@/auth";
import { AuthError, Session } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import PrismaErrorHandler from "./PrismaErrorHandler";
import { UserRole } from "@prisma/client";

export const currentUser = async () => {
  const session = await auth();

  return session?.user;
};

export const currentRole = async () => {
  const session = await auth();

  return session?.user?.role;
};

export interface NextRequestExt extends NextRequest {
  // this is for my needs
  auth?: Session;
  params: Promise<Record<string, string>>;
}

export const withAuth = (
  handler: (req: NextRequestExt) => Promise<Response>,
) => {
  return async function (
    req: NextRequestExt,
    { params }: { params: Promise<Record<string, string>> },
  ) {
    try {
      const session = await auth();
      if (!session) {
        return NextResponse.json(
          { errors: null, status: "error", message: "Unauthorized" },
          { status: 401 },
        );
      }

      // Add session to request for use in handler
      req.auth = session;
      req.params = params;

      return handler(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return PrismaErrorHandler.handleAuth(error);
      }

      return PrismaErrorHandler.handlePrisma(error as never);
    }
  };
};

export const withAuthRole = (
  handler: (req: NextRequestExt) => Promise<Response>,
) => {
  return async function (
    req: NextRequestExt,
    { params }: { params: Promise<Record<string, string>> },
  ) {
    try {
      const session = await auth();
      if (!session) {
        return NextResponse.json(
          { errors: null, status: "error", message: "Unauthorized" },
          { status: 401 },
        );
      }

      if (session.user.role.name !== UserRole.SUPERADMIN) {
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

      // Add session to request for use in handler
      req.auth = session;
      req.params = params;

      return handler(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return PrismaErrorHandler.handleAuth(error);
      }

      return PrismaErrorHandler.handlePrisma(error as never);
    }
  };
};
