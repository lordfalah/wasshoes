import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

class PrismaErrorHandler {
  static handlePrisma(error: PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025":
        return NextResponse.json(
          {
            status: "error",
            message: error.message || "Record not found",
            errors: {
              code: 404,
              description: "The record with the provided ID was not found.",
            },
          },
          { status: 404 },
        );

      case "P2002":
        const fields = (error.meta?.target as string[]) || [];

        const errorDetails = fields.reduce(
          (acc, field) => {
            acc[field] = `The value for ${field} must be unique.`;
            return acc;
          },
          {} as Record<string, string>,
        );
        return NextResponse.json(
          {
            status: "error",
            message: `Unique constraint failed on the following field(s): ${fields.join(", ")}.`,
            errors: errorDetails,
          },
          { status: 409 },
        );

      default:
        return this.handleDefault(error);
    }
  }

  static handleAuth(error: AuthError) {
    switch (error.type) {
      case "JWTSessionError":
        return NextResponse.json(
          {
            status: "error",
            message: error.message || "Error cookies",
            errors: null,
          },
          { status: 401, statusText: error.name },
        );

      case "CredentialsSignin":
        return NextResponse.json(
          {
            status: "error",
            message: error.message || "Invalid credentials provided.",
            errors: null,
          },
          { status: 401, statusText: error.name },
        );

      case "CallbackRouteError":
        return NextResponse.json(
          {
            status: "error",
            message: error.message || "Authentication callback failed.",
            errors: null,
          },
          { status: 400, statusText: error.name },
        );

      case "OAuthAccountNotLinked":
        return NextResponse.json(
          {
            status: "error",
            message:
              error.message ||
              "This account is already linked with another method.",
            errors: null,
          },
          { status: 409, statusText: error.name },
        );

      default:
        return NextResponse.json(
          {
            status: "error",
            message: error.name || "Authentication failed. Please try again.",
            errors: null,
          },
          { status: 500, statusText: error.name },
        );
    }
  }

  static handleZodCompact(error: ZodError) {
    const errors = error.issues.reduce(
      (acc, issue) => {
        const path = issue.path.at(-1)?.toString() ?? "unknown";
        acc[path] = issue.message;
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

  static handleDefault(error: unknown) {
    return NextResponse.json(
      {
        status: "error",
        message:
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "An unexpected error occurred. Please try again later.",
        errors: {
          code: 500,
          description: "Internal server error.",
        },
      },
      { status: 500 },
    );
  }
}

export default PrismaErrorHandler;
