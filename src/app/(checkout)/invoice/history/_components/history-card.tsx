import { getStoreByStoreId } from "@/actions/store";
import { InvoiceLineItems } from "@/components/invoice/cart-line-items";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatToRupiah } from "@/lib/utils";
import {
  Category,
  Order,
  Paket,
  PaketOrder,
  TStatusOrder,
} from "@prisma/client";
import React from "react";

interface HistoryOrderCardProps {
  order: Order & {
    pakets: Array<
      PaketOrder & { paket: Paket & { category: Category | null } }
    >;
  };
}

const HistoryOrderCard: React.FC<HistoryOrderCardProps> = async ({ order }) => {
  const store = await getStoreByStoreId(order.storeId);
  return (
    <Card
      key={order.storeId}
      as="section"
      id={`checkout-store-${order.storeId}`}
      aria-labelledby={`checkout-store-${order.storeId}-heading`}
      className={
        order.status === TStatusOrder.SETTLEMENT
          ? "border-green-500"
          : "border-destructive"
      }
    >
      <CardHeader className="flex flex-row items-center justify-between space-x-4 py-4">
        <CardTitle className="line-clamp-1">{store.data?.name}</CardTitle>
        <span className="text-muted-foreground line-clamp-1 font-semibold uppercase">
          {order.status}
        </span>
      </CardHeader>
      <Separator className="mb-4" />
      <CardContent className="space-y-1.5">
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

export default HistoryOrderCard;
