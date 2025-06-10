"use client";

import { FormEvent, Fragment, useState } from "react";
import { Button } from "../ui/button";
import { Loader2, HandCoins } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/handle-error";

const PayTransaction: React.FC<{ paymentToken: string }> = ({
  paymentToken,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const payTransaction = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    toast.promise(
      (async () => {
        try {
          window.snap.pay(paymentToken);
        } catch (error) {
          throw error;
        } finally {
          setIsLoading(false);
        }
      })(),
      {
        loading: "Saving Transaction",
        success: "Transaction pay successfully!",
        error: (err) => getErrorMessage(err),
      },
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
      </TooltipTrigger>
      <TooltipContent>
        <p>Pay</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default PayTransaction;
