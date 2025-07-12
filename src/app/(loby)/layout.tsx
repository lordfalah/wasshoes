import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";

export default async function LobyLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="fixed top-0 right-0 bottom-0 left-0 -z-10 h-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,#6f6f6f50_1px,transparent_1px),linear-gradient(to_bottom,#6f6f6f50_1px,transparent_1px)]"></div>
      <SiteHeader />
      <main className="flex-1">
        {children}
        {modal}
      </main>
      <SiteFooter />
    </div>
  );
}
