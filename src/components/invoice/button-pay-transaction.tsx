"use client";

import { FormEvent, Fragment, useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

const ButtonPayTransaction: React.FC<{ paymentToken: string }> = ({
  paymentToken,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const payTransaction = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      window.snap.pay(paymentToken);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={payTransaction}>
      <Button
        aria-label="Checkout"
        size="sm"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <Fragment>
            <Loader2 className="animate-spin" />
            Please wait
          </Fragment>
        ) : (
          "Pay"
        )}
      </Button>
    </form>
  );
};

export default ButtonPayTransaction;
