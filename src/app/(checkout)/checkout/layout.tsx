import Script from "next/script";
import { Fragment } from "react";

export default function CheckoutLayout({ children }: React.PropsWithChildren) {
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
