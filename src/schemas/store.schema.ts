import { extractMapUrlFromIframe, isValidSlug } from "@/lib/utils";
import { ClientUploadedFileData } from "uploadthing/types";
import { z } from "zod";

// store-schema.ts
export const StoreSchemaClient = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(150, "Name must be at most 150 characters"),

  description: z
    .string({ required_error: "description is required" })
    .min(1, "description is required")
    .max(250, "description must be at most 250 characters"),

  bannerImgs: z
    .array(z.custom<File>())
    .min(1, "File is required")
    .max(3, "Maximum of 3 files allowed")
    .refine((files) => files.every((file) => file.size <= 4 * 1024 * 1024), {
      message: "File size must be less than 4MB",
      path: ["bannerImgs"],
    }),

  mapEmbed: z
    .string()
    .min(1, "Embed iframe is required")
    .transform((val, ctx) => {
      const mapUrl = extractMapUrlFromIframe(val);
      if (!mapUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid iframe embed code. Must contain a valid src URL.",
        });
        return z.NEVER;
      }
      return mapUrl;
    }),

  adminId: z.string().cuid(),
});

export const StoreSchemaServer = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),

  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .toLowerCase()
    .refine((value) => isValidSlug(value), {
      message:
        "Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens.",
    }),

  description: z
    .string({ required_error: "description is required" })
    .min(1, "description is required")
    .max(250, "description must be at most 250 characters"),
  bannerImgs: z
    .array(
      z.custom<ClientUploadedFileData<{ uploadedBy: string | undefined }>>(),
    )
    .min(1, "File is required")
    .nonempty("BannerStore must have at least one image")
    .max(3, "Please select up to 3 files")
    .refine((files) => files.every((file) => file.size <= 4 * 1024 * 1024), {
      message: "File size must be less than 4MB",
      path: ["bannerImgs"],
    }),

  mapEmbed: z
    .string()
    .url("URL Google Maps tidak valid")
    .refine((val) => val.includes("https://www.google.com/maps/embed"), {
      message: "URL harus berasal dari Google Maps Embed",
    }),

  adminId: z.string().cuid(),
});

export type TStoreSchemaClient = z.infer<typeof StoreSchemaClient>;
export type TStoreSchemaServer = z.infer<typeof StoreSchemaServer>;
