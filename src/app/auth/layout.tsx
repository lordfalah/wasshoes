import PlaiceholderImage, { TypeImage } from "@/components/plaiceholder-image";
import { Footprints } from "lucide-react";
import Link from "next/link";
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
              <Footprints className="size-4" />
            </div>
            Wasshoes
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <PlaiceholderImage
          src={"/images/logo/wasshoes3.png"}
          alt="logo"
          fill
          className="absolute inset-0 h-full w-full object-cover shadow-2xl shadow-black drop-shadow-xl"
          type={TypeImage.PUBLIC}
        />
        {/* <PlaiceholderImage
          alt="placeholder"
          src={"https://ui.shadcn.com/placeholder.svg"}
          type={TypeImage.REMOTE}
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          fill
        /> */}
      </div>
    </main>
  );
};

export default AuthLayout;
