import FormSetting from "./_components/form-setting";
import { auth } from "@/auth";

const SettingsPage: React.FC = async () => {
  const session = await auth();

  if (!session) throw new Error("data not found");

  return <FormSetting user={session.user} />;
};

export default SettingsPage;
