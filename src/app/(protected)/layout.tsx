import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const session = await auth();
  if (session?.user.role.name === UserRole.USER) redirect("/");
  else {
    return <>{children}</>;
  }
};

export default ProtectedLayout;
