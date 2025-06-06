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
import ButtonPayTransaction from "./button-pay-transaction";

interface InvoiceCardProps {
  order: Order & {
    pakets: Array<
      PaketOrder & { paket: Paket & { category: Category | null } }
    >;
  };
}

const InvoiceCard: React.FC<InvoiceCardProps> = async ({ order }) => {
  const store = await getStoreByStoreId(order.storeId);

  return (
    <Card
      key={order.storeId}
      as="section"
      id={`checkout-store-${order.storeId}`}
      aria-labelledby={`checkout-store-${order.storeId}-heading`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-x-4 py-4">
        <CardTitle className="line-clamp-1">{store.data?.name}</CardTitle>

        <ShiftingCountdown
          className="hidden sm:block"
          createdAt={order.createdAt}
        />

        {store.data && order.paymentToken ? (
          <ButtonPayTransaction paymentToken={order.paymentToken} />
        ) : (
          "Store Required"
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
