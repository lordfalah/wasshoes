import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreateCategory from "./_components/create-category";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { TError, TSuccess } from "@/types/route-api";
import { Category, Paket, Store } from "@prisma/client";
import { cookies } from "next/headers";
import DataTablePackage from "./_components/data-table-package";

const fetchPackage = async (cookieAuth: ReadonlyRequestCookies) => {
  try {
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/store/package`,
      {
        headers: {
          Cookie: cookieAuth.toString(),
        },
      },
    );
    const res = (await req.json()) as
      | TSuccess<
          Array<
            Paket & {
              category: Category;
              stores: Store[];
            }
          >
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

export default async function PageDashboardPackage() {
  const cookieStore = await cookies();
  const { data: dataPackages } = await fetchPackage(cookieStore);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="flex">
        <Button asChild type="button" variant="outline">
          <Link href={"/dashboard/package/build"}>Create Package</Link>
        </Button>

        <CreateCategory />
      </div>

      <DataTablePackage data={dataPackages} />
    </div>
  );
}
