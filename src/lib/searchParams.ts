import { createLoader, parseAsString } from "nuqs/server";

// Describe your search params, and reuse this in useQueryStates / createSerializer:
export const nameUser = {
  name: parseAsString.withDefault(""),
};

export const dataDashboard = {
  data: parseAsString.withDefault("categorys"),
};

export const loadSearchParamsDataDashboard = createLoader(dataDashboard);
export const loadSearchParams = createLoader(nameUser);
