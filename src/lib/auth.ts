import { auth } from "@/auth";
import { Session } from "next-auth";
import { type NextRequest } from "next/server";

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
        return Response.json(
          { errors: null, status: "error", message: "Unauthorized" },
          { status: 401 },
        );
      }

      // Add session to request for use in handler
      req.auth = session;
      req.params = params;

      return handler(req);
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  };
};
