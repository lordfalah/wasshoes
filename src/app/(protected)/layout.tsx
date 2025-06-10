import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const session = await auth();
  if (!session) redirect("/");
  else {
    return <main>{children}</main>;
  }
};

export default ProtectedLayout;
