import CreatePackage from "./_components/create-package";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { Category, Store } from "@prisma/client";
import { TError, TSuccess } from "@/types/route-api";
import { cookies } from "next/headers";

const fetchCategory = async (cookieAuth: ReadonlyRequestCookies) => {
  try {
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/store/category`,
      {
        headers: {
          Cookie: cookieAuth.toString(),
        },
      },
    );
    const res = (await req.json()) as
      | TSuccess<Category[]>
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

const fetchStore = async (cookieAuth: ReadonlyRequestCookies) => {
  try {
    const req = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/store`, {
      headers: {
        Cookie: cookieAuth.toString(),
      },
    });
    const res = (await req.json()) as
      | TSuccess<Store[]>
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

export default async function PageDashboardPackageBuild() {
  const cookieStore = await cookies();
  const [{ data: dataCategorys }, { data: dataStores }] = await Promise.all([
    fetchCategory(cookieStore),
    fetchStore(cookieStore),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <CreatePackage categorys={dataCategorys} stores={dataStores} />
    </div>
  );
}
