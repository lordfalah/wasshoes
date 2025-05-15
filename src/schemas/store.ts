import { ClientUploadedFileData } from "uploadthing/types";
import { z } from "zod";

// store-schema.ts
export const StoreSchemaClient = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),

  bannerImgs: z
    .array(z.custom<File>())
    .min(1, "File is required")
    .max(3, "Maximum of 3 files allowed")
    .refine((files) => files.every((file) => file.size <= 4 * 1024 * 1024), {
      message: "File size must be less than 4MB",
      path: ["bannerImgs"],
    }),
});

export const StoreSchemaServer = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),
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
});

export type TStoreSchemaClient = z.infer<typeof StoreSchemaClient>;
export type TStoreSchemaServer = z.infer<typeof StoreSchemaServer>;
