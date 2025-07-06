import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import * as z from "zod";
import { getSortingStateParser } from "@/lib/parsers";
import {
  Order,
  Store,
  TLaundryStatus,
  TPaymentMethod,
  TPriority,
  TStatusOrder,
} from "@prisma/client";

export const searchParamsCacheOrder = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Order & { store: Store }>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  customer: parseAsString.withDefault(""),
  status: parseAsArrayOf(
    z.enum(Object.values(TStatusOrder) as [TStatusOrder, ...TStatusOrder[]]),
  ).withDefault([]),

  laundryStatus: parseAsArrayOf(
    z.enum(
      Object.values(TLaundryStatus) as [TLaundryStatus, ...TLaundryStatus[]],
    ),
  ).withDefault([]),
  priority: parseAsArrayOf(
    z.enum(Object.values(TPriority) as [TPriority, ...TPriority[]]),
  ).withDefault([]),
  paymentMethod: parseAsArrayOf(
    z.enum(
      Object.values(TPaymentMethod) as [TPaymentMethod, ...TPaymentMethod[]],
    ),
  ),
  totalPrice: parseAsInteger,
  headStore: parseAsString.withDefault(""),
  store: parseAsString.withDefault(""),
  createdAt: parseAsArrayOf(z.coerce.number()).withDefault([]),
});

export type GetOrderSchema = Awaited<
  ReturnType<typeof searchParamsCacheOrder.parse>
>;
