import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Script from "next/script";
import { Fragment } from "react";

export default async function CheckoutLayout({
  children,
}: React.PropsWithChildren) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <Fragment>
      <Script
        type="text/javascript"
        src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL}
        data-client-key={`${process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}`}
        strategy="lazyOnload"
        className="bg-black"
      />
      <main>{children}</main>
    </Fragment>
  );
}
