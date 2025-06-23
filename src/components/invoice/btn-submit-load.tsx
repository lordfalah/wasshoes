"use client";

import React, { useId } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CircleX,
  LucideIcon,
  Check,
  Plus,
  Edit,
  Trash2,
  HandCoins,
} from "lucide-react"; // Impor semua ikon yang mungkin Anda butuhkan
import { cn } from "@/lib/utils";

// 1. Buat objek pemetaan ikon
const LucideIconsMap: Record<string, LucideIcon> = {
  CircleX: CircleX,
  Loader2: Loader2,
  Check: Check,
  Plus: Plus,
  Edit: Edit,
  Trash2: Trash2,
  HandCoins: HandCoins,
  // Tambahkan ikon lain yang mungkin Anda butuhkan di sini
};

interface BtnSubmitWithLoadProps {
  /**
   * The name of the Lucide icon to display when the form is not pending (e.g., "CircleX", "Check").
   * Defaults to "CircleX" if not provided.
   */
  iconName?: keyof typeof LucideIconsMap;
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
  iconName = "CircleX", // Nilai default sebagai string
  className,
  variant = "outline",
}) => {
  const { pending } = useFormStatus();

  // 2. Ambil komponen ikon dari map berdasarkan iconName
  const IconComponent = LucideIconsMap[iconName] || CircleX; // Fallback jika iconName tidak ditemukan
  const id = useId();

  return (
    <Button
      disabled={pending}
      className={cn(pending ? "cursor-progress" : "cursor-pointer", className)}
      aria-label={`submit-btn-${id}`}
      size="sm"
      type="submit"
      variant={variant}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <IconComponent className="size-5" />
      )}
    </Button>
  );
};

export default BtnSubmitWithLoad;
