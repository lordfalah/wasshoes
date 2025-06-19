"use server";

import { currentRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getErrorMessage } from "@/lib/handle-error";
import { UserRole } from "@prisma/client";

export const admin = async () => {
  const role = await currentRole();

  if (role?.name === UserRole.ADMIN) {
    return { success: "Allowed Server Action!" };
  }

  return { error: "Forbidden Server Action!" };
};

export const getAdmins = async () => {
  try {
    const admins = await db.user.findMany({
      where: {
        role: {
          name: UserRole.ADMIN,
        },

        store: null,
      },
    });

    return {
      data: admins,
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
};
