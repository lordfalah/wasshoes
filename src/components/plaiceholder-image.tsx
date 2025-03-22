import { getImage, getImageRemote } from "@/hooks/use-plaiceholder";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

export enum TypeImage {
  REMOTE = "REMOTE",
  PUBLIC = "PUBLIC",
}

const PlaiceholderImage: React.FC<
  {
    alt: string;
    src: string;
    type: TypeImage;
  } & React.ComponentPropsWithoutRef<typeof Image>
> = async ({ alt, src, type, ...props }) => {
  const base64 =
    type === TypeImage.REMOTE ? await getImageRemote(src) : await getImage(src);

  return (
    <Image
      {...props}
      alt={alt}
      className={cn(props.className)}
      src={src}
      blurDataURL={base64}
      placeholder="blur"
    />
  );
};

export default PlaiceholderImage;
