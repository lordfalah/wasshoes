"use client";

import React from "react";
import { useFormStatus } from "react-dom"; // Asumsi Anda menggunakan useFormStatus dari React DOM
import { Button } from "@/components/ui/button"; // Pastikan path ke Button Shadcn/ui Anda benar
import { Loader2, CircleX, LucideIcon } from "lucide-react"; // Impor LucideIcon
import { cn } from "@/lib/utils";

interface BtnSubmitWithLoadProps {
  /**
   * The icon component to display when the form is not pending.
   * Defaults to CircleX if not provided.
   */
  icon?: LucideIcon; // <--- Definisi props untuk ikon
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary";
}

const BtnSubmitWithLoad: React.FC<BtnSubmitWithLoadProps> = ({
  icon: Icon = CircleX, // <--- Destructure dan berikan nilai default CircleX
  // Teruskan props lain jika ada, contoh:
  className,
  variant = "outline",
}) => {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      className={cn(pending ? "cursor-progress" : "cursor-pointer", className)}
      aria-label="cancel-transaction"
      size="sm"
      type="submit"
      variant={variant}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-5" />
      )}
    </Button>
  );
};

export default BtnSubmitWithLoad;
