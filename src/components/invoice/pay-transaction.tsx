"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { FormEvent, Fragment, useState } from "react";
import { Button } from "../ui/button";
import { Loader2, HandCoins, X } from "lucide-react";
import { showErrorToast } from "@/lib/handle-error";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const PayTransaction: React.FC<{ paymentToken: string }> = ({
  paymentToken,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const payTransaction = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setIsOpen(true);

    try {
      // Sembunyikan Snap sebelumnya jika masih aktif
      if (window.snap?.hide) {
        window.snap.hide();
      }

      window.snap.embed(paymentToken, {
        embedId: "snap-container",
      });
    } catch (error) {
      console.log(error);
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <form onSubmit={payTransaction}>
          <Button
            aria-label="Checkout"
            size="sm"
            type="submit"
            variant={"outline"}
            disabled={isLoading}
          >
            {isLoading ? (
              <Fragment>
                <Loader2 className="animate-spin" />
                Please wait
              </Fragment>
            ) : (
              <HandCoins className="size-5" />
            )}
          </Button>
        </form>
      </AlertDialogTrigger>
      <AlertDialogContent
        id="snap-container"
        aria-describedby="content-snap"
        aria-description="desc-snap"
        className="px-0 py-0 sm:p-6"
      >
        <VisuallyHidden>
          <AlertDialogDescription id="snap-desc">
            Snap UI
          </AlertDialogDescription>
          <AlertDialogTitle id="snap-title">Snap UI</AlertDialogTitle>
        </VisuallyHidden>

        <AlertDialogFooter className="flex flex-row justify-end">
          <AlertDialogCancel asChild>
            <Button
              variant={"outline"}
              size="icon"
              type="button"
              onClick={() => {
                window.snap?.hide(); // Sembunyikan Snap secara eksplisit
                setIsOpen(false); // Tutup AlertDialog
              }}
              className="group"
            >
              <X className="group-hover:stroke-red-400" />
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PayTransaction;
