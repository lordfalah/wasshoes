import { getAdmins } from "@/actions/admin";
import CreateStore from "./_components/create-store";

export default async function PageDashboardStoreBuild() {
  const { data: dataAdmins, error: errorAdmin } = await getAdmins();
  if (errorAdmin || !dataAdmins) throw new Error(errorAdmin);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <CreateStore admins={dataAdmins} />
    </div>
  );
}
