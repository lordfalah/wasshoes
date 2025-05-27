import { ClientUploadedFileData } from "uploadthing/types";
import { z } from "zod";

export const BasePackageFields = {
  name: z
    .string()
    .min(3, { message: "Nama paket minimal 3 karakter" })
    .max(100, { message: "Nama paket maksimal 100 karakter" }),

  description: z
    .string()
    .min(10, { message: "Deskripsi minimal 10 karakter" })
    .max(200, { message: "Deskripsi maksimal 200 karakter" }),

  price: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") {
        const num = Number(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    z
      .number({
        required_error: "Harga wajib diisi",
        invalid_type_error: "Harga harus berupa angka",
      })
      .min(1000, { message: "Harga tidak boleh dibawah 1000" }),
  ),

  categoryId: z
    .string({
      required_error: "Kategori wajib dipilih",
      invalid_type_error: "ID kategori tidak valid",
    })
    .cuid({ message: "ID kategori tidak valid" }),

  isVisible: z.boolean({
    required_error: "Status visibilitas harus dipilih",
    invalid_type_error: "Status visibilitas harus berupa true atau false",
  }),

  nameStore: z.array(z.string()).optional(),
};

export const PackageSchemaClient = z.object({
  ...BasePackageFields,
  image: z
    .array(z.custom<File>())
    .min(1, "File is required")
    .max(1, "Maximum of 1 files allowed")
    .refine((files) => files.every((file) => file.size <= 4 * 1024 * 1024), {
      message: "File size must be less than 4MB",
      path: ["image"],
    }),
});

export const PackageSchemaServer = z.object({
  ...BasePackageFields,
  image: z
    .array(
      z.custom<ClientUploadedFileData<{ uploadedBy: string | undefined }>>(),
    )
    .min(1, "File is required")
    .nonempty("Package Image must have at least one image")
    .max(1, "Please select up to 1 files")
    .refine((files) => files.every((file) => file.size <= 4 * 1024 * 1024), {
      message: "File size must be less than 4MB",
      path: ["image"],
    }),
});

export type TPackageSchemaClient = z.infer<typeof PackageSchemaClient>;
export type TPackageSchemaServer = z.infer<typeof PackageSchemaServer>;
