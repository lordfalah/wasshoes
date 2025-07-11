"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { update } from "@/auth";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserById(user.id as string);

  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" };
    }

    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Verification email sent!" };
  }

  // Validasi password jika ingin mengubah password
  if (
    (values.password && !values.newPassword) ||
    (!values.password && values.newPassword)
  ) {
    return { error: "Password lama dan baru harus diisi bersamaan" };
  }

  if (values.password && values.newPassword && dbUser.password) {
    const match = await bcrypt.compare(values.password, dbUser.password);
    if (!match) {
      return { error: "Incorrect password!" };
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10);
    values.password = hashedPassword;
    delete values.newPassword;
  } else {
    // Jika tidak ingin mengubah password
    delete values.password;
    delete values.newPassword;
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...values,
      role: {
        connect: {
          name: values.role,
        },
      },
    },

    include: {
      role: true,
    },
  });

  if (!updatedUser.role) {
    return { error: "Role is Required!" };
  }

  await update({
    user: {
      name: updatedUser.name,
      email: updatedUser.email,
      isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
      role: updatedUser.role,
      firstName: updatedUser.firstName || "",
      lastName: updatedUser.lastName || "",
    },
  });

  return { success: "Settings Updated!" };
};
