import * as z from "zod";
import { cartItemSchema } from "./cart.schema";

export const getOrderLineItemsSchema = z.object({
  storeId: z.string(),
  items: z.array(cartItemSchema),
});

export type TGetOrderLineItemsSchema = z.infer<typeof getOrderLineItemsSchema>;
