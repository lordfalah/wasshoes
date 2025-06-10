import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "../../../../components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCountOrder } from "@/actions/order";
import { Fragment } from "react";

const InvoiceCart: React.FC = async () => {
  const { data: totalOrderByCurrentUser, error } = await getCountOrder();
  if (totalOrderByCurrentUser === null) throw new Error(error);

  return (
    <Link
      className={cn(
        buttonVariants({
          variant: "outline",
          size: "icon",
        }),
        "relative",
      )}
      href={"/invoice"}
    >
      {totalOrderByCurrentUser > 0 && (
        <Fragment>
          <span className="absolute -top-2 -right-2 inline-flex size-3 animate-ping rounded-full bg-sky-400 opacity-75"></span>
          <span className="absolute -top-2 -right-2 inline-flex size-3 rounded-full bg-sky-500"></span>
        </Fragment>
      )}

      <ShoppingBag className="size-4" aria-hidden="true" />
      <span className="sr-only">Search products</span>
    </Link>
  );
};

export default InvoiceCart;
