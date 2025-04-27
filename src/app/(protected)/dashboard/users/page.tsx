import { cookies } from "next/headers";
import CreateRole from "./_components/create-role";
import DataTableUser from "./_components/data-table-user";
import { Role, User } from "@prisma/client";
import { TError, TSuccess } from "@/types/route-api";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import DataTableRole from "./_components/data-table-role";
import type { SearchParams } from "nuqs/server";
import { loadSearchParams } from "@/lib/searchParams";
import { Suspense } from "react";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export type TDataUsersRole = Pick<
  User,
  "name" | "email" | "image" | "emailVerified" | "id"
> & {
  role: Role;
};

const fetchUsers = async (cookieAuth: ReadonlyRequestCookies) => {
  try {
    const req = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users`, {
      headers: {
        Cookie: cookieAuth.toString(),
      },
    });
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

const fetchRoles = async (cookieAuth: ReadonlyRequestCookies) => {
  try {
    const req = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/roles`, {
      headers: {
        Cookie: cookieAuth.toString(),
      },
    });
    const res = (await req.json()) as
      | TSuccess<Role[]>
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
  const { name } = await loadSearchParams(searchParams);
  const keyLoading = `name=${name}`;
  const cookieStore = await cookies();
  const [{ data: dataUsers }, { data: dataRoles }] = await Promise.all([
    fetchUsers(cookieStore),
    fetchRoles(cookieStore),
  ]);

  const filterDataUser = dataUsers.filter((data) => {
    // Pastikan data.name itu ada dan tipe string
    if (typeof data.name !== "string" || !data.name.trim()) {
      return false; // kalau name tidak ada atau kosong, jangan ditampilkan
    }

    // Jika name dari input kosong, tampilkan semua
    if (name.trim() === "") {
      return true;
    }

    // Jika ada input name, cek apakah name mengandung input
    return data.name.toLowerCase().includes(name.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <CreateRole />

      <div className="flex flex-wrap gap-6 xl:flex-nowrap">
        <Suspense
          key={keyLoading}
          fallback={<p className="text-4xl text-red-400">Loading...</p>}
        >
          <DataTableUser data={filterDataUser} />
        </Suspense>
        <DataTableRole data={dataRoles} />
      </div>
    </div>
  );
}
