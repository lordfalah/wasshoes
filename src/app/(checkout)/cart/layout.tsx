import { SiteHeader } from "@/components/layouts/site-header";

export default async function CartLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
