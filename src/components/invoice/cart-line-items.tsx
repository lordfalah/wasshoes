import Image from "next/image";
import { Slot } from "@radix-ui/react-slot";
import { cn, formatToRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";
import { Category, Paket, PaketOrder } from "@prisma/client";
import { Fragment } from "react";

interface InvoiceItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<PaketOrder & { paket: Paket & { category: Category | null } }>;
  isScrollable?: boolean;
  isEditable?: boolean;
  variant?: "default" | "minimal";
}

export function InvoiceLineItems({
  items,
  isScrollable = true,
  isEditable = true,
  variant = "default",
  className,
  ...props
}: InvoiceItemsProps) {
  const Comp = isScrollable ? ScrollArea : Slot;

  return (
    <Comp className="h-full">
      <div
        className={cn(
          "flex w-full flex-col gap-5",
          isScrollable && "px-6",
          className,
        )}
        {...props}
      >
        {items.map((item) => {
          // --- Hitung subtotal dan harga final per item untuk tampilan invoice ---
          const itemSubtotal = Number(item.paket.price) * Number(item.quantity);
          // item.priceOrder datang dari PaketOrder, yang merupakan harga yang disimpan di order
          const itemFinalPrice =
            (item.priceOrder ?? Number(item.paket.price)) *
            Number(item.quantity); // Pastikan itemFinalPrice dihitung berdasarkan total quantity
          const itemOriginalTotalPerItem =
            Number(item.paket.price) * Number(item.quantity); // Total harga asli per item

          let itemAdjustmentText: string | null = null;
          let itemAdjustmentAmount = 0;

          // HANYA hitung penyesuaian jika priceOrder berbeda dari paket.price
          if (item.priceOrder !== item.paket.price) {
            // Perubahan utama di sini
            if (itemFinalPrice > itemOriginalTotalPerItem) {
              itemAdjustmentAmount = itemFinalPrice - itemOriginalTotalPerItem;
              itemAdjustmentText = `Biaya Tambahan: ${formatToRupiah(itemAdjustmentAmount)}`;
            } else if (itemFinalPrice < itemOriginalTotalPerItem) {
              itemAdjustmentAmount = itemOriginalTotalPerItem - itemFinalPrice;
              itemAdjustmentText = `Diskon Biaya: ${formatToRupiah(itemAdjustmentAmount)}`;
            }
          }
          // --- Akhir perhitungan per item ---

          return (
            <div key={item.id} className="space-y-3">
              <div
                className={cn(
                  "flex flex-nowrap items-start justify-between gap-4",
                  isEditable && "xs:flex-row flex-col",
                )}
              >
                <div className="flex items-center space-x-4">
                  {variant === "default" ? (
                    <div className="relative aspect-square size-16 min-w-fit overflow-hidden rounded">
                      {item?.paket.image ? (
                        <Image
                          src={
                            item?.paket.image.ufsUrl ??
                            "/images/product-placeholder.webp"
                          }
                          alt={item?.paket.image.name ?? item?.paket.name}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          fill
                          className="absolute object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="bg-secondary flex h-full items-center justify-center">
                          <Icons.placeholder
                            className="text-muted-foreground size-4"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex flex-col space-y-1 self-start">
                    <span className="line-clamp-1 text-sm font-medium">
                      {item?.paket.name}
                    </span>
                    {/* Tampilkan Qty dan harga asli per unit, sama untuk editable/non-editable di invoice */}
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {formatToRupiah(item.paket.price)} each x {item.quantity}
                    </span>
                    {variant === "default" ? (
                      <span className="text-muted-foreground line-clamp-1 text-xs capitalize">
                        {`${item.paket?.category?.name}`}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Bagian yang menampilkan harga (berbeda untuk editable/non-editable) */}
                {isEditable ? (
                  // Jika editable, mungkin Anda ingin menampilkan input untuk mengubah quantity
                  // Tapi di konteks invoice, isEditable=true mungkin tidak relevan atau berarti editing quantity.
                  // Saya asumsikan di invoice, item tidak diedit.
                  // Anda bisa menyesuaikan ini jika ada kebutuhan untuk editing di tampilan invoice.
                  <div className="flex flex-col items-end space-y-1 font-medium">
                    <span className="ml-auto line-clamp-1 text-sm">
                      {formatToRupiah(itemSubtotal)}
                    </span>
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {formatToRupiah(item.paket.price)} each
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end space-y-1 font-medium">
                    {/* Harga Asli (Subtotal) Item */}
                    <div className="flex items-center gap-x-2">
                      <span className="text-muted-foreground text-xs">
                        Subtotal:
                      </span>
                      <span className="line-clamp-1 text-sm">
                        {formatToRupiah(itemSubtotal)}
                      </span>
                    </div>

                    {/* Biaya Tambahan / Diskon Biaya (jika ada) */}
                    {itemAdjustmentText && (
                      <Fragment>
                        <div className="flex items-center gap-x-2 text-sm">
                          <span
                            className={cn(
                              "text-xs",
                              itemFinalPrice > itemSubtotal
                                ? "text-destructive"
                                : "text-emerald-500", // Warna untuk biaya tambahan/diskon
                            )}
                          >
                            {itemAdjustmentText.split(":")[0]}
                          </span>
                          <span
                            className={cn(
                              "line-clamp-1 text-sm",
                              itemFinalPrice > itemSubtotal
                                ? "text-destructive"
                                : "text-emerald-500",
                            )}
                          >
                            {itemAdjustmentText.split(":")[1]}
                          </span>
                        </div>

                        {/* Harga Final Item */}
                        <div className="flex items-center gap-x-2">
                          <span className="text-muted-foreground text-xs">
                            Final:
                          </span>
                          <span className="line-clamp-1 text-sm">
                            {formatToRupiah(itemFinalPrice)}
                          </span>
                        </div>
                      </Fragment>
                    )}
                  </div>
                )}
              </div>
              {variant === "default" ? <Separator /> : null}
            </div>
          );
        })}
      </div>
    </Comp>
  );
}
