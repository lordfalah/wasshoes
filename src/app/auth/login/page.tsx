import { LoginForm } from "@/components/auth/login-form";
import PlaiceholderImage, { TypeImage } from "@/components/plaiceholder-image";
import { GalleryVerticalEnd } from "lucide-react";
import React from "react";

const LoginPage: React.FC = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <LoginForm />
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <PlaiceholderImage
          alt="placeholder"
          src={"https://ui.shadcn.com/placeholder.svg"}
          type={TypeImage.REMOTE}
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          fill
        />
      </div>
    </div>
  );
};

export default LoginPage;
