import Image from "next/image";
import { Slot } from "@radix-ui/react-slot";
import { cn, formatToRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UpdateCart } from "@/components/checkout/update-cart";
import { Icons } from "@/components/icons";
import { Category, Paket, Store } from "@prisma/client";

interface CartLineItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<
    Paket & { stores: Store[]; quantity: number; category: Category | null }
  >;
  isScrollable?: boolean;
  isEditable?: boolean;
  variant?: "default" | "minimal";
}

export function CartLineItems({
  items,
  isScrollable = true,
  isEditable = true,
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
          isScrollable && "px-6",
          className,
        )}
        {...props}
      >
        {items.map((item) => (
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
                          item.image.ufsUrl ??
                          "/images/product-placeholder.webp"
                        }
                        alt={item.image.name ?? item.name}
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
                  {isEditable ? (
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {formatToRupiah(item.price)} x {item.quantity} ={" "}
                      {formatToRupiah(
                        Number(item.price) * Number(item.quantity),
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      Qty {item.quantity}
                    </span>
                  )}
                  {variant === "default" ? (
                    <span className="text-muted-foreground line-clamp-1 text-xs capitalize">
                      {`${item.category?.name}`}
                    </span>
                  ) : null}
                </div>
              </div>
              {isEditable ? (
                <UpdateCart cartLineItem={item} />
              ) : (
                <div className="flex flex-col space-y-1 font-medium">
                  <span className="ml-auto line-clamp-1 text-sm">
                    {formatToRupiah(Number(item.price) * item.quantity)}
                  </span>
                  <span className="text-muted-foreground line-clamp-1 text-xs">
                    {formatToRupiah(item.price)} each
                  </span>
                </div>
              )}
            </div>
            {variant === "default" ? <Separator /> : null}
          </div>
        ))}
      </div>
    </Comp>
  );
}
