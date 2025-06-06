import Image from "next/image";
import { Slot } from "@radix-ui/react-slot";
import { cn, formatToRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";
import { Category, Paket, PaketOrder } from "@prisma/client";

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
        {items.map((item) => (
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
                  {isEditable ? (
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {formatToRupiah(item?.paket.price)} x {item?.quantity} ={" "}
                      {formatToRupiah(
                        Number(item?.paket.price) * Number(item?.quantity),
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      Qty {item.quantity}
                    </span>
                  )}
                  {variant === "default" ? (
                    <span className="text-muted-foreground line-clamp-1 text-xs capitalize">
                      {`${item.paket?.category?.name}`}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col space-y-1 font-medium">
                <span className="ml-auto line-clamp-1 text-sm">
                  {formatToRupiah(Number(item.paket.price) * item.quantity)}
                </span>
                <span className="text-muted-foreground line-clamp-1 text-xs">
                  {formatToRupiah(item.paket.price)} each
                </span>
              </div>
            </div>
            {variant === "default" ? <Separator /> : null}
          </div>
        ))}
      </div>
    </Comp>
  );
}
