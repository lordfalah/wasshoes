import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

import { formatToRupiah } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { getStoreByStoreId } from "@/actions/store";
import { Category, Order, Paket, PaketOrder } from "@prisma/client";
import { InvoiceLineItems } from "./cart-line-items";
import ShiftingCountdown from "../shifting-countdown";
import ButtonPayTransaction from "./pay-transaction";
import BtnCancelTransaction from "./btn-cancel-transaction";
import { cancelTransactionOrder } from "@/actions/order";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InvoiceCardProps {
  order: Order & {
    pakets: Array<
      PaketOrder & { paket: Paket & { category: Category | null } }
    >;
  };
}

const InvoiceCard: React.FC<InvoiceCardProps> = async ({ order }) => {
  const { data: storeData, error } = await getStoreByStoreId(order.storeId);
  if (!storeData) throw new Error(error ?? "Error getStoreByStoreId");

  const onCancelTransaction = async () => {
    "use server";

    try {
      const { error } = await cancelTransactionOrder(order.id);
      if (error) throw new Error(error);
    } catch (error) {
      throw error;
    }
  };

  return (
    <Card
      key={order.storeId}
      as="section"
      id={`checkout-store-${order.storeId}`}
      aria-labelledby={`checkout-store-${order.storeId}-heading`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-x-4 py-4">
        <CardTitle className="line-clamp-1">{storeData.name}</CardTitle>

        <ShiftingCountdown
          className="hidden sm:block"
          createdAt={order.createdAt}
        />

        {order.paymentToken ? (
          <div className="flex flex-wrap gap-2">
            <ButtonPayTransaction paymentToken={order.paymentToken} />

            <Tooltip>
              <TooltipTrigger asChild>
                <form action={onCancelTransaction}>
                  <BtnCancelTransaction />
                </form>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancel</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          "Token Required"
        )}
      </CardHeader>
      <Separator className="mb-4" />
      <CardContent className="space-y-1.5">
        <ShiftingCountdown
          className="block sm:hidden"
          createdAt={order.createdAt}
        />
        <InvoiceLineItems
          isEditable={false}
          items={order.pakets}
          className="max-h-[280px] !px-0 sm:!px-6"
        />
      </CardContent>
      <Separator className="mb-4" />
      <CardFooter className="space-x-4">
        <span className="flex-1">
          Total ({order.pakets.reduce((acc, item) => acc + item.quantity, 0)})
        </span>
        <span>Rp. {formatToRupiah(order.totalPrice)}</span>
      </CardFooter>
    </Card>
  );
};

export default InvoiceCard;
