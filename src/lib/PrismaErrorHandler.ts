import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

class PrismaErrorHandler {
  static handlePrisma(error: PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025": // Record not found
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

      case "P2002": // Must unique record
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

  static handleDefault(error: unknown) {
    // Default error response for non-Prisma errors
    return NextResponse.json(
      {
        status: "error",
        message:
          JSON.stringify(error) ||
          "An unexpected error occurred. Please try again later.",
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
