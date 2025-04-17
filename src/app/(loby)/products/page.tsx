import { type Metadata } from "next";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { AlertCard } from "@/components/alert-card";

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Products",
  description: "Buy products from our stores",
};

export default async function ProductsPage({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading size="sm">Products</PageHeaderHeading>
        <PageHeaderDescription size="sm">
          Buy products from our stores
        </PageHeaderDescription>
      </PageHeader>
      <AlertCard />
    </Shell>
  );
}
