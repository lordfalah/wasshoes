import * as React from "react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layouts/site-header";
import { auth } from "@/auth";
import Script from "next/script";

export default async function InvoiceLayout({
  children,
}: React.PropsWithChildren) {
  const user = await auth();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <React.Fragment>
      <Script
        type="text/javascript"
        src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL}
        data-client-key={`${process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}`}
        strategy="lazyOnload"
      />
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </div>
    </React.Fragment>
  );
}
