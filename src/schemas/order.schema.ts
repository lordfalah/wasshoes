import * as z from "zod";
import { cartItemSchema } from "./cart.schema";
import { LaundryStatus } from "@prisma/client";

export const getOrderLineItemsSchema = z.object({
  storeId: z.string(),
  items: z.array(cartItemSchema),
});

export const orderSchema = z.object({
  statusLaundry: z.enum([
    LaundryStatus.AWAITING_PROCESSING,
    LaundryStatus.COMPLETED,
    LaundryStatus.IN_PROGRESS,
    LaundryStatus.ON_HOLD,
    LaundryStatus.QUALITY_CHECK,
    LaundryStatus.READY_FOR_COLLECTION,
  ]),
});

export type TOrderSchema = z.infer<typeof orderSchema>;
export type TGetOrderLineItemsSchema = z.infer<typeof getOrderLineItemsSchema>;
