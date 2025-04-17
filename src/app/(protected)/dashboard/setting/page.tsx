import React from "react";
import { auth } from "@/auth";
import FormSetting from "./_components/form-setting";
import { UploadAvatar } from "./_components/form-avatar";

const SettingPage: React.FC = async () => {
  const session = await auth();

  if (!session || !session.user.id) throw new Error("data not found");

  return (
    <div className="p-4 lg:p-6">
      <UploadAvatar
        avatar={{
          src:
            session.user.image ??
            `https://robohash.org/${session.user.id}.png?size=350x350`,
          alt: session.user.name ?? `Avatar : ${session.user.id}`,
          width: 350,
          height: 350,
          id: session.user.id,
        }}
      />
      <FormSetting user={session.user} />
    </div>
  );
};

export default SettingPage;
