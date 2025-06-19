import {
  createLoader,
  parseAsInteger,
  parseAsJson,
  parseAsString,
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

const PaginationNuqs = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
};

// SuperAdmin / Owner
export const dataDashboardSearchParamsOwner = {
  ...PaginationNuqs,
  sort: parseAsJson(SortOptionSchema.parse).withDefault([]),
  nameAdmin: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
};
export const loadSearchParamsDataDashboardOwner = createLoader(
  dataDashboardSearchParamsOwner,
);

export const loadSearchParamsDataDashboardCategory = createLoader(
  dataDashboardCategory,
);

// Admin / Employer
export const dataDashboardSearchParamsEmployer = {
  ...PaginationNuqs,
  sort: parseAsJson(SortOptionSchema.parse).withDefault([]),
  status: parseAsString.withDefault(""),
  customer: parseAsString.withDefault(""),
};

export const loadSearchParamsDataDashboardEmployer = createLoader(
  dataDashboardSearchParamsEmployer,
);
