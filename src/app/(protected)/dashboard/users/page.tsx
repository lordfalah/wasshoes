import { cookies } from "next/headers";
import DataTableUser from "./_components/data-table-user";
import { Role, User } from "@prisma/client";
import { TError, TSuccess } from "@/types/route-api";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import {
  loadSearchParamsDataDashboardUser,
  SortOptionSchemaUser,
} from "@/lib/searchParams";
import { SearchParams } from "nuqs";
import { z } from "zod";

export type TDataUsersRole = Pick<
  User,
  "name" | "email" | "image" | "emailVerified" | "id"
> & {
  role: Role;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const fetchUsers = async (
  cookieAuth: ReadonlyRequestCookies,
  query: {
    page?: number;
    perPage?: number;
    name?: string;
    sort?: z.infer<typeof SortOptionSchemaUser>;
    role?: string;
  } = {},
) => {
  try {
    const params = new URLSearchParams();

    if (query.page) params.set("page", query.page.toString());
    if (query.name) params.set("name", query.name);
    if (query.role) params.set("role", query.role);
    if (query.sort) params.set("sort", JSON.stringify(query.sort));
    if (query.perPage) params.set("perPage", query.perPage.toString());

    const req = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/users?${params.toString()}`,
      {
        headers: {
          Cookie: cookieAuth.toString(),
        },
      },
    );
    const res = (await req.json()) as
      | TSuccess<TDataUsersRole[]>
      | TError<{
          code?: number;
          description?: string;
        }>;

    if (!res.data) {
      throw new Error(res.message || res.errors.description);
    }

    return res;
  } catch (error) {
    throw error;
  }
};

export default async function PageDashboardUsers({ searchParams }: PageProps) {
  const cookieStore = await cookies();

  const { name, page, perPage, sort, role } =
    await loadSearchParamsDataDashboardUser(searchParams);

  const { data: dataUsers, total } = await fetchUsers(cookieStore, {
    name,
    page,
    sort,
    perPage,
    role,
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="data-table-container">
        <DataTableUser data={dataUsers} total={total || 0} />
      </div>
    </div>
  );
}
