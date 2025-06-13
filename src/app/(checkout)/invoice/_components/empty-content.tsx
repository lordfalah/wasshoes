import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const EmptyContent: React.FC<{ text: string }> = ({ text }) => {
  return (
    <section
      id={`empty-content`}
      aria-labelledby="empty-content-heading"
      className="flex h-full flex-col items-center justify-center space-y-1 pt-16"
    >
      <Icons.cart
        className="text-muted-foreground mb-4 size-16"
        aria-hidden="true"
      />
      <div className="text-muted-foreground text-xl font-medium">{text}</div>
      <Link
        aria-label="Add items to your cart to checkout"
        href="/products"
        className={cn(
          buttonVariants({
            variant: "link",
            size: "sm",
            className: "text-muted-foreground text-sm",
          }),
        )}
      >
        Add items your cart to checkout
      </Link>
    </section>
  );
};
