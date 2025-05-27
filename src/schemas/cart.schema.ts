import { z } from "zod";

export const updateCartItemSchema = z.object({
  quantity: z.number().min(0).default(1),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0),
});

export const deleteCartItemSchema = z.object({
  productId: z.string(),
});

export const deleteCartItemsSchema = z.object({
  productIds: z.array(z.string()),
});

export type TUpdateCartItemSchema = z.infer<typeof updateCartItemSchema>;
export type TCartItemSchema = z.infer<typeof cartItemSchema>;
export type TDeleteCartItemSchema = z.infer<typeof deleteCartItemSchema>;
export type TDeleteCartItemsSchema = z.infer<typeof deleteCartItemsSchema>;
