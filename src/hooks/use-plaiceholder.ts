"use server";

import fs from "node:fs/promises";
import { getPlaiceholder } from "plaiceholder";

export async function getImage(src: string) {
  const buffer = await fs.readFile("./public" + src);

  const { base64 } = await getPlaiceholder(buffer, { size: 32 });

  return base64;
}

export const getImageRemote = async (src: string) => {
  const buffer = await fetch(src).then(async (res) =>
    Buffer.from(await res.arrayBuffer()),
  );

  const { base64 } = await getPlaiceholder(buffer, { size: 32 });

  return base64;
};
