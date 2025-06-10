import { TPaymentMethod } from "@prisma/client";
import { ClientUploadedFileData } from "uploadthing/types";
import { z } from "zod";

// Data form konsumen (manual input dari Admin)
export const customerSchema = z.object({
  first_name: z.string().min(1, "Nama wajib diisi"),
  last_name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid").optional().default(""),
  phone: z
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
});

// Digunakan saat user login & checkout paket sendiri lewat aplikasi/web
export const userCheckoutSchemaServer = z.object({
  storeId: z.string().cuid(),
  paymentMethod: z.enum([TPaymentMethod.MANUAL, TPaymentMethod.AUTO]),
  grossAmount: z.number(),
  shoesImages: z
    .array(
      z.custom<ClientUploadedFileData<{ uploadedBy: string | undefined }>>(),
    )
    .min(1, "File is required")
    .nonempty("BannerStore must have at least one image")
    .max(2, "Please select up to 2 files")
    .refine((files) => files.every((file) => file.size <= 4 * 1024 * 1024), {
      message: "File size must be less than 4MB",
      path: ["shoesImages"],
    }),
  pakets: z
    .array(
      z.object({
        paketId: z.string().cuid(),
        quantity: z.number().min(1).default(1),
        price: z.preprocess(
          (val) => {
            if (typeof val === "string" && val.trim() !== "") {
              // Hapus titik ribuan lalu parse jadi angka
              const cleaned = val.replace(/\./g, "");
              const num = Number(cleaned);
              return isNaN(num) ? val : num;
            }
            return val;
          },
          z
            .number({
              required_error: "Harga wajib diisi",
              invalid_type_error: "Harga harus berupa angka",
            })
            .min(1000, { message: "Harga tidak boleh di bawah 1.000" }),
        ),
      }),
    )
    .min(1, "Minimal 1 paket harus dipilih"),

  customer: customerSchema,
});

export const userCheckoutSchemaClient = z.object({
  storeId: z.string().cuid(),
  paymentMethod: z.enum([TPaymentMethod.MANUAL, TPaymentMethod.AUTO]),
  grossAmount: z.number(),
  shoesImages: z
    .array(z.custom<File>())
    .min(1, "Minimal 1 gambar sepatu")
    .max(2, "Maksimal 2 gambar sepatu")
    .refine((files) => files.every((file) => file.size <= 4 * 1024 * 1024), {
      message: "Ukuran file maksimal 4MB",
    }),

  pakets: z
    .array(
      z.object({
        paketId: z.string().cuid(),
        quantity: z.number().min(1).default(1),
        price: z.preprocess(
          (val) => {
            if (typeof val === "string" && val.trim() !== "") {
              // Hapus titik ribuan lalu parse jadi angka
              const cleaned = val.replace(/\./g, "");
              const num = Number(cleaned);
              return isNaN(num) ? val : num;
            }
            return val;
          },
          z
            .number({
              required_error: "Harga wajib diisi",
              invalid_type_error: "Harga harus berupa angka",
            })
            .min(1000, { message: "Harga tidak boleh di bawah 1.000" }),
        ),
      }),
    )
    .min(1, "Minimal 1 paket harus dipilih")
    .optional(),
  customer: customerSchema,
});

export const adminCheckoutSchemaClient = z.object({
  orderId: z.string().cuid(),
  customer: customerSchema,
  paymentMethod: z.enum([TPaymentMethod.MANUAL, TPaymentMethod.AUTO]),
  pakets: z
    .array(
      z.object({
        paketId: z.string().cuid(),
        priceOrder: z.number().min(0).optional(),
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
        priceOrder: z.number().min(0).optional(),
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
