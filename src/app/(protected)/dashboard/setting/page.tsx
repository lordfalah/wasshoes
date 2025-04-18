import React from "react";
import { auth } from "@/auth";
import FormSetting from "./_components/form-setting";
import { UploadAvatar } from "./_components/form-avatar";

const SettingPage: React.FC = async () => {
  const session = await auth();

  if (!session || !session.user) throw new Error("You are not Authentication");

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <UploadAvatar
        avatar={{
          src:
            session.user.image ??
            `https://robohash.org/${session.user.id}.png?size=350x350`,
          alt: session.user.name ?? `Avatar : ${session.user.id}`,
          width: 350,
          height: 350,
          id: session.user.id as string,
        }}
      />
      <FormSetting user={session.user} />
    </div>
  );
};

export default SettingPage;
