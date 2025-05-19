import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { Category, Paket, Store } from "@prisma/client";
import { TError, TSuccess } from "@/types/route-api";
import { cookies } from "next/headers";
import EditPackage from "./_components/edit-package";
import { ClientUploadedFileData } from "uploadthing/types";

const fetchCategoryDetail = async (
  cookieAuth: ReadonlyRequestCookies,
  packageId: string,
) => {
  try {
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/store/package/${packageId}`,
      {
        headers: {
          Cookie: cookieAuth.toString(),
        },
      },
    );
    const res = (await req.json()) as
      | TSuccess<Paket & { stores: Store[]; category: Category }>
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

const fetchCategorys = async (cookieAuth: ReadonlyRequestCookies) => {
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

const fetchStores = async (cookieAuth: ReadonlyRequestCookies) => {
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

export default async function PageDashboardPackageEdit({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const [{ packageId }, cookieStore] = await Promise.all([params, cookies()]);
  const [{ data: dataPaket }, { data: dataCategorys }, { data: dataStores }] =
    await Promise.all([
      fetchCategoryDetail(cookieStore, packageId),
      fetchCategorys(cookieStore),
      fetchStores(cookieStore),
    ]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <EditPackage
        dataPackage={{
          ...dataPaket,
          image: dataPaket.image as unknown as ClientUploadedFileData<{
            uploadedBy: string | undefined;
          }>,
        }}
        dataCategorys={dataCategorys}
        dataStores={dataStores}
      />
    </div>
  );
}
