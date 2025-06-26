import React from "react";
import DataTableRole from "../users/_components/data-table-role";
import { cookies } from "next/headers";
import { TError, TSuccess } from "@/types/route-api";
import { Role } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import CreateRole from "../users/_components/create-role";

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

const PageRole: React.FC = async () => {
  const cookieStore = await cookies();
  const { data } = await fetchRoles(cookieStore);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <CreateRole />
      <div className="data-table-container">
        <DataTableRole data={data} />
      </div>
    </div>
  );
};

export default PageRole;
