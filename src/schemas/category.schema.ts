import { z } from "zod";

export const CategorySchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nama kategori minimal 3 karakter" })
    .max(50, { message: "Nama kategori maksimal 50 karakter" }),
  description: z
    .string()
    .min(10, { message: "Deskripsi minimal 10 karakter" })
    .max(200, { message: "Deskripsi maksimal 200 karakter" }),
});

export const CategorySchemaWithId = CategorySchema.extend({
  id: z.string().cuid({ message: "ID tidak valid" }),
});

export type TCategorySchema = z.infer<typeof CategorySchema>;
