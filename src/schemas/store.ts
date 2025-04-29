import { ClientUploadedFileData } from "uploadthing/types";
import { z } from "zod";

export const StoreSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),
  bannerStore: z
    .array(
      z.custom<ClientUploadedFileData<{ uploadedBy: string | undefined }>>(),
    )
    .nonempty("BannerStore must have at least one image"),
});

export type TStoreSchema = z.infer<typeof StoreSchema>;

// z.instanceof(File),
//   {
//     required_error: "BannerStore must be an array",
//   };
