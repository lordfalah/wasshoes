import Midtrans from "midtrans-client";

const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey: `${process.env.NEXT_PUBLIC_MIDTRANS_SERVER_KEY}`,
  clientKey: `${process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}`,
});

export const coreApi = new Midtrans.CoreApi({
  isProduction: false,
  serverKey: `${process.env.NEXT_PUBLIC_MIDTRANS_SERVER_KEY}`,
  clientKey: `${process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}`,
});

export default snap;
