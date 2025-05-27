import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CheckoutLayout({
  children,
}: React.PropsWithChildren) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return <main>{children}</main>;
}
