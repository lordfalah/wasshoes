"use client";

import React from "react";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import { CircleX, Loader2 } from "lucide-react";

const BtnCancelTransaction: React.FC = () => {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      className={`${pending ? "cursor-progress" : "cursor-pointer"}`}
      aria-label="cancel-transaction"
      size="sm"
      type="submit"
      variant={"outline"}
    >
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <CircleX className="size-5" />
      )}
    </Button>
  );
};

export default BtnCancelTransaction;
