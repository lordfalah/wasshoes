import { TStoreSchemaServer } from "@/schemas/store";
import { TError, TSuccess } from "@/types/route-api";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import DetailStore from "./_components/detail-store";

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
      | TSuccess<TStoreSchemaServer & { id: string }>
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
  const { data: dataStore } = await fetchStoreDetail(cookieStore, storeId);
  if (!dataStore) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <DetailStore data={dataStore} />
    </div>
  );
}
