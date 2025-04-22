"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";
import { UserRole } from "@prisma/client";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // Periksa apakah role default sudah ada
  let defaultRole = await db.role.findFirst({
    where: { name: UserRole.USER }, // Cari berdasarkan nama role
  });

  // Jika belum ada, buat role default
  if (!defaultRole) {
    defaultRole = await db.role.create({
      data: {
        name: UserRole.USER,
      },
    });
  }

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: {
        connect: { id: defaultRole.id }, // Hubungkan role default
      },
    },
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return { success: "Confirmation email sent!" };
};
