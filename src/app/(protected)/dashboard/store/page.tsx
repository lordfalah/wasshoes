import { Button } from "@/components/ui/button";
import { TStoreSchemaServer } from "@/schemas/store";
import { TError, TSuccess } from "@/types/route-api";
import { Role, User } from "@prisma/client";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import Link from "next/link";
import DataTableStore from "./_components/data-table-store";

const fetchStore = async (cookieAuth: ReadonlyRequestCookies) => {
  try {
    const req = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/store`, {
      headers: {
        Cookie: cookieAuth.toString(),
      },
    });
    const res = (await req.json()) as
      | TSuccess<
          (TStoreSchemaServer & {
            id: string;
            users: (User & { role: Role[] })[];
          })[]
        >
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

export default async function PageDashboardStore() {
  const cookieStore = await cookies();
  const { data: dataStores } = await fetchStore(cookieStore);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <Button asChild type="button" variant="outline">
        <Link href={"/dashboard/store/build"}>Create Store</Link>
      </Button>

      <DataTableStore data={dataStores} />
    </div>
  );
}
