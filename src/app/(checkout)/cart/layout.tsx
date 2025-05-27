import * as React from "react";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layouts/site-header";
import { auth } from "@/auth";

export default async function CartLayout({
  children,
}: React.PropsWithChildren) {
  const user = await auth();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
