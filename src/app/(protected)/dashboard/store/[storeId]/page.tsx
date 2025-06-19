import { TError, TSuccess } from "@/types/route-api";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import DetailStore from "./_components/detail-store";
import { Store } from "@prisma/client";
import { getAdmins } from "@/actions/admin";

const fetchStoreDetail = async (
  cookieAuth: ReadonlyRequestCookies,
  id: string,
) => {
  try {
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/store/${id}`,
      {
        headers: {
          Cookie: cookieAuth.toString(),
        },
      },
    );
    const res = (await req.json()) as
      | TSuccess<Store>
      | TError<{
          code?: number;
          description?: string;
        }>;

    if (!res.data) {
      return res;
    }

    return res;
  } catch (error) {
    throw error;
  }
};

export default async function PageDetailStore({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const [{ storeId }, cookieStore] = await Promise.all([params, cookies()]);
  const [{ data: dataStore }, { data: dataAdmins, error: errorAdmin }] =
    await Promise.all([fetchStoreDetail(cookieStore, storeId), getAdmins()]);
  if (!dataStore) {
    notFound();
  }

  if (!dataAdmins || errorAdmin) throw new Error(errorAdmin);

  console.log(dataAdmins);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <DetailStore dataStore={dataStore} dataAdmins={dataAdmins} />
    </div>
  );
}
