import { SearchParams } from "nuqs";
import { auth } from "@/auth";
import OwnerContent from "./_components/owner-content";
import { UserRole } from "@prisma/client";
import EmployerContent from "./_components/employer-content";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PageDashboard({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (session.user.role.name === UserRole.SUPERADMIN) {
    return <OwnerContent searchParams={searchParams} />;
  } else if (session.user.role.name === UserRole.ADMIN) {
    return (
      <EmployerContent
        storeId={session.user.storeId}
        searchParams={searchParams}
      />
    );
  } else {
    return "asas";
  }
}
