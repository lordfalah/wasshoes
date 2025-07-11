import * as z from "zod";
import { UserRole } from "@prisma/client";

export const UserSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.SUPERADMIN]),
  email: z.optional(z.string().email()),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password minimal 6 karakter",
    }),

  newPassword: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password baru minimal 6 karakter",
    }),
  url: z.optional(z.string().url()),
  firstName: z.optional(z.string().min(1, "Nama wajib diisi")),
  lastName: z.optional(z.string().min(1, "Nama wajib diisi")),
  phone: z.optional(
    z
      .string()
      .min(8, "Nomor HP terlalu pendek") // Minimal 8 digit (misal 08123456) atau +628123456
      .max(15, "Nomor HP terlalu panjang") // Batas maksimal yang wajar
      .transform((val) => val.replace(/[\s-]/g, "")) // Hapus spasi dan dash
      .refine((val) => /^(0|62|\+62)8[1-9][0-9]{6,10}$/.test(val), {
        // Ubah regex untuk panjang 10-13 digit total
        path: ["phone"],
        message:
          "Format nomor HP tidak valid (contoh: 081234567890 atau +6281234567890)",
      }),
  ),
});

export const SettingsSchema = UserSchema.refine(
  (data) => {
    if (data.password && !data.newPassword) {
      return false;
    }

    return true;
  },
  {
    message: "New password is required!",
    path: ["newPassword"],
  },
).refine(
  (data) => {
    if (data.newPassword && !data.password) {
      return false;
    }

    return true;
  },
  {
    message: "Password is required!",
    path: ["password"],
  },
);

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z
  .object({
    email: z.string().email({
      message: "Email is required",
    }),
    password: z.string().min(1, {
      message: "Password is required",
    }),
    code: z.string().optional(), // Tidak diwajibkan di awal
  })
  .refine(
    (data) => {
      if (data.code && data.code.length !== 6) {
        return false;
      }
      return true;
    },
    { message: "Your one-time 2fa must be 6 characters.", path: ["code"] },
  );

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

export const RoleSchema = UserSchema.pick({ role: true });
export const roles = [
  { label: "Super Admin", value: UserRole.SUPERADMIN },
  { label: "Admin", value: UserRole.ADMIN },
  { label: "User", value: UserRole.USER },
] satisfies Array<{ label: string; value: UserRole }>;
