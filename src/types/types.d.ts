import { TCartItemSchema } from "@/schemas/cart.schema";
import { TCustomerSchema } from "@/schemas/checkout.schema";
import { Role } from "@prisma/client";
import { type DefaultSession } from "next-auth";
import { ClientUploadedFileData } from "uploadthing/types";

export type ExtendedUser = DefaultSession["user"] & {
  role: Role;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  storeId?: string;
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
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
    storeId?: string;
  }
}

interface SnapPayOptions {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

interface Snap {
  pay: (token: string, options?: SnapPayOptions) => void;
  // Jika ada fungsi lain di Snap.js, Anda bisa tambahkan di sini
  // Misalnya, Anda mungkin melihat `window.snap.hide()` atau lainnya
}

declare global {
  interface Window {
    snap: Snap;
  }

  // type prisma only column have json
  namespace PrismaJson {
    type Image = ClientUploadedFileData<{ uploadedBy: string | undefined }>;
    type ItemsPaket = TCartItemSchema;
    type InformationCustomers = TCustomerSchema;
  }
}
