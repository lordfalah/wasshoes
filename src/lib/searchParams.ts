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

const SortOptionSchemaDashboard = z.array(
  z.object({
    id: z.enum(["totalPrice", "status"]),
    desc: z.boolean(),
  }),
);

export const SortOptionSchemaUser = z.array(
  z.object({
    id: z.enum(["email", "role"]),
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
  sort: parseAsJson(SortOptionSchemaDashboard.parse).withDefault([]),
  customer: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
};
export const loadSearchParamsDataDashboardOwner = createLoader(
  dataDashboardSearchParamsOwner,
);

export const dataDashboardUserSearchParams = {
  ...PaginationNuqs,
  sort: parseAsJson(SortOptionSchemaUser.parse).withDefault([]),
  name: parseAsString.withDefault(""),
  role: parseAsString.withDefault(""),
};

export const loadSearchParamsDataDashboardUser = createLoader(
  dataDashboardUserSearchParams,
);

export const loadSearchParamsDataDashboardCategory = createLoader(
  dataDashboardCategory,
);

// Admin / Employer
export const dataDashboardSearchParamsEmployer = {
  ...PaginationNuqs,
  sort: parseAsJson(SortOptionSchemaDashboard.parse).withDefault([]),
  status: parseAsString.withDefault(""),
  customer: parseAsString.withDefault(""),
};

export const loadSearchParamsDataDashboardEmployer = createLoader(
  dataDashboardSearchParamsEmployer,
);
