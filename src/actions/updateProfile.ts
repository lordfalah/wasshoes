"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const updateProfile = async (avatar: string) => {
  const session = await auth();
  if (!session) return { error: "Not authorization" };

  try {
    await db.user.update({
      where: {
        id: session.user.id,
      },

      data: {
        image: avatar,
      },
    });

    return { success: "Update profile Success" };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return { error: "Fail update profile" };
  }
};
