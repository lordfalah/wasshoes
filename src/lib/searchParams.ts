import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  SearchParams,
} from "nuqs/server";
import { z } from "zod";

export const dataDashboardCategory = {
  data: parseAsString.withDefault("categorys"),
};

const SortOptionSchema = z.array(
  z.object({
    id: z.enum(["totalPrice", "status"]), // ✅ tambahkan opsi lain jika perlu
    desc: z.boolean(),
  }),
);

export const dataDashboardSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsJson(SortOptionSchema.parse).withDefault([]),
  nameAdmin: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
};

// ✅ Loader siap pakai di server component
export const loadSearchParamsDataDashboard = createLoader(
  dataDashboardSearchParams,
);

export const loadSearchParamsDataDashboardCategory = createLoader(
  dataDashboardCategory,
);
