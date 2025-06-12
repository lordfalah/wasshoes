import { type Metadata } from "next";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";
import { AlertCard } from "@/components/alert-card";
import { getFeaturedStores } from "@/actions/store";
import { StoreCard } from "@/components/ui/store-card";

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_APP_URL}`),
  title: "Stores",
  description: "Buy products from our stores",
};

export default async function StoresPage() {
  const stores = await getFeaturedStores();

  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading size="sm">Stores</PageHeaderHeading>
        <PageHeaderDescription size="sm">
          Buy products from our stores
        </PageHeaderDescription>
      </PageHeader>

      <section
        className="animate-fade-up xs:grid-cols-2 grid grid-cols-1 gap-4 md:grid-cols-4"
        style={{ animationDelay: "0.50s", animationFillMode: "both" }}
      >
        {stores.length > 0 ? (
          stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              href={`/stores/${store.slug}`}
            />
          ))
        ) : (
          <AlertCard />
        )}
      </section>
    </Shell>
  );
}
