import { TPaymentMethod } from "@prisma/client";
import { ClientUploadedFileData } from "uploadthing/types";
import { z } from "zod";

// Data form konsumen (manual input dari Admin)
export const customerSchema = z.object({
  first_name: z.string().min(1, "Nama wajib diisi"),
  last_name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid").optional().default(""),
  phone: z.string().min(8, "Nomor HP tidak valid").optional().default(""),
});

// Digunakan saat user login & checkout paket sendiri lewat aplikasi/web
export const userCheckoutSchemaServer = z.object({
  orderId: z.string().cuid(),
  paymentMethod: z.enum([TPaymentMethod.MANUAL, TPaymentMethod.AUTO]),
  pakets: z
    .array(
      z.object({
        paketId: z.string().cuid(),
        quantity: z.number().min(1).default(1),
        shoesImages: z
          .array(
            z.custom<
              ClientUploadedFileData<{ uploadedBy: string | undefined }>
            >(),
          )
          .min(1, "File is required")
          .nonempty("BannerStore must have at least one image")
          .max(2, "Please select up to 2 files")
          .refine(
            (files) => files.every((file) => file.size <= 4 * 1024 * 1024),
            {
              message: "File size must be less than 4MB",
              path: ["shoesImages"],
            },
          ),
      }),
    )
    .min(1, "Minimal 1 paket harus dipilih"),
});

export const userCheckoutSchemaClient = z.object({
  orderId: z.string().cuid(),
  paymentMethod: z.enum([TPaymentMethod.MANUAL, TPaymentMethod.AUTO]),
  pakets: z
    .array(
      z.object({
        paketId: z.string().cuid(),
        quantity: z.number().min(1).default(1),
        shoesImages: z
          .array(z.custom<File>())
          .min(1, "Minimal 1 gambar sepatu")
          .max(2, "Maksimal 2 gambar sepatu")
          .refine(
            (files) => files.every((file) => file.size <= 4 * 1024 * 1024),
            {
              message: "Ukuran file maksimal 4MB",
            },
          ),
      }),
    )
    .min(1, "Minimal 1 paket harus dipilih"),
});

export const adminCheckoutSchemaClient = z.object({
  orderId: z.string().cuid(),
  customer: customerSchema,
  paymentMethod: z.enum([TPaymentMethod.MANUAL, TPaymentMethod.AUTO]),
  pakets: z
    .array(
      z.object({
        paketId: z.string().cuid(),
        priceOrder: z.number().min(0),
        quantity: z.number().min(1).default(1),
        shoesImages: z
          .array(z.custom<File>())
          .min(1, "Minimal 1 gambar sepatu")
          .max(2, "Maksimal 2 gambar sepatu")
          .refine(
            (files) => files.every((file) => file.size <= 4 * 1024 * 1024),
            {
              message: "Ukuran file maksimal 4MB",
            },
          ),
      }),
    )
    .min(1, "Minimal 1 paket harus dipilih"),
});

export const adminCheckoutSchemaServer = z.object({
  orderId: z.string().cuid(),
  customer: customerSchema,
  paymentMethod: z.enum([TPaymentMethod.MANUAL, TPaymentMethod.AUTO]),
  pakets: z
    .array(
      z.object({
        paketId: z.string().cuid(),
        priceOrder: z.number().min(0),
        quantity: z.number().min(1).default(1),
        shoesImages: z
          .array(
            z.custom<
              ClientUploadedFileData<{ uploadedBy: string | undefined }>
            >(),
          )
          .min(1, "File is required")
          .nonempty("BannerStore must have at least one image")
          .max(2, "Please select up to 2 files")
          .refine(
            (files) => files.every((file) => file.size <= 4 * 1024 * 1024),
            {
              message: "File size must be less than 4MB",
              path: ["shoesImages"],
            },
          ),
      }),
    )
    .min(1, "Minimal 1 paket harus dipilih"),
});

export type TCustomerSchema = z.infer<typeof customerSchema>;
export type TUserCheckoutSchemaClient = z.infer<
  typeof userCheckoutSchemaClient
>;
export type TUserCheckoutSchemaServer = z.infer<
  typeof userCheckoutSchemaServer
>;

export type TAdminCheckoutSchemaClient = z.infer<
  typeof adminCheckoutSchemaClient
>;
export type TAdminCheckoutSchemaServer = z.infer<
  typeof adminCheckoutSchemaServer
>;
