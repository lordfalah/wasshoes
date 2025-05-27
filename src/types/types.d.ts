import { TCartItemSchema } from "@/schemas/cart.schema";
import { Role } from "@prisma/client";
import { type DefaultSession } from "next-auth";
import { ClientUploadedFileData } from "uploadthing/types";

export type ExtendedUser = DefaultSession["user"] & {
  role: Role;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

// The `JWT` interface can be found in the `next-auth/jwt` submodule
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    role: Role;
  }
}

// type prisma only column have json
declare global {
  namespace PrismaJson {
    type Image = ClientUploadedFileData<{ uploadedBy: string | undefined }>;
    type ItemsPaket = TCartItemSchema;
  }
}
