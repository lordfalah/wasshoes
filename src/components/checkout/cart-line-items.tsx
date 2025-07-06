import Image from "next/image";
import { Slot } from "@radix-ui/react-slot";
import { calculateItemPriceDetails, cn, formatToRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UpdateCart } from "@/components/checkout/update-cart";
import { Icons } from "@/components/icons";
import { Category, Paket, Store } from "@prisma/client";
import UpdatePriceItemCart from "./update-price-item-cart";
import { Fragment } from "react";

interface CartLineItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<
    Paket & {
      stores: Store[];
      priceOrder?: number | null;
      quantity: number;
      category: Category | null;
    }
  >;
  isScrollable?: boolean;
  isEditable?: boolean;
  isAdmin?: boolean;
  variant?: "default" | "minimal";
}

export async function CartLineItems({
  items,
  isScrollable = true,
  isEditable = true,
  isAdmin = false,
  variant = "default",
  className,
  ...props
}: CartLineItemsProps) {
  const Comp = isScrollable ? ScrollArea : Slot;

  return (
    <Comp className="h-full">
      <div
        className={cn(
          "flex w-full flex-col gap-5",
          isScrollable && "px-0 sm:px-6",
          className,
        )}
        {...props}
      >
        {items.map((item) => {
          // --- Gunakan fungsi reusable di sini ---
          const { itemSubtotal, itemFinalPrice, itemAdjustmentText } =
            calculateItemPriceDetails({
              price: item.price,
              quantity: item.quantity,
              priceOrder: item.priceOrder,
            });
          // --- Akhir penggunaan fungsi reusable ---

          return (
            <div key={item.id} className="space-y-3">
              <div
                className={cn(
                  "flex items-start justify-between gap-4",
                  isEditable && "xs:flex-row flex-col",
                )}
              >
                <div className="flex items-center space-x-4">
                  {variant === "default" ? (
                    <div className="relative aspect-square size-16 min-w-fit overflow-hidden rounded">
                      {item?.image ? (
                        <Image
                          src={
                            item.image[0].ufsUrl ??
                            "/images/product-placeholder.webp"
                          }
                          alt={item.image[0].name ?? item.name}
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
                      {item.name}
                    </span>
                    {/* Tampilkan harga asli per unit dan total berdasarkan quantity */}
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {formatToRupiah(item.price)} each x {item.quantity} ={" "}
                      {formatToRupiah(item.price * item.quantity)}
                    </span>
                    {variant === "default" ? (
                      <span className="text-muted-foreground line-clamp-1 text-xs capitalize">
                        {`${item.category?.name}`}
                      </span>
                    ) : null}
                  </div>
                </div>

                {isEditable ? (
                  <div className="flex flex-col gap-2.5">
                    <UpdateCart cartLineItem={item} />
                    {isAdmin && <UpdatePriceItemCart cartLineItem={item} />}
                  </div>
                ) : (
                  <div className="flex flex-col items-end space-y-1 font-medium">
                    {" "}
                    {/* Tambahkan items-end */}
                    {/* Harga Asli (Subtotal) Item */}
                    <div className="xs:flex hidden items-center gap-x-2">
                      <span className="text-muted-foreground text-xs">
                        Subtotal:
                      </span>
                      <span className="line-clamp-1 text-sm">
                        Rp. {formatToRupiah(itemSubtotal)}
                      </span>
                    </div>
                    {/* Biaya Tambahan / Diskon Biaya (jika ada) */}
                    {itemAdjustmentText && (
                      <Fragment>
                        <div className="xs:flex hidden items-center gap-x-2 text-sm">
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
                        <div className="xs:flex hidden items-center gap-x-2">
                          <span className="text-muted-foreground text-xs">
                            Final:
                          </span>
                          <span className="line-clamp-1 text-sm">
                            Rp. {formatToRupiah(itemFinalPrice)}
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
