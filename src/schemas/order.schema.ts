import * as z from "zod";
import { cartItemSchema } from "./cart.schema";
import { TLaundryStatus } from "@prisma/client";

export const getOrderLineItemsSchema = z.object({
  storeId: z.string(),
  items: z.array(cartItemSchema),
});

export const orderSchema = z.object({
  statusLaundry: z.enum([
    TLaundryStatus.AWAITING_PROCESSING,
    TLaundryStatus.COMPLETED,
    TLaundryStatus.IN_PROGRESS,
    TLaundryStatus.ON_HOLD,
    TLaundryStatus.QUALITY_CHECK,
    TLaundryStatus.READY_FOR_COLLECTION,
  ]),
});

export type TOrderSchema = z.infer<typeof orderSchema>;
export type TGetOrderLineItemsSchema = z.infer<typeof getOrderLineItemsSchema>;
