import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnterFullScreenIcon } from "@radix-ui/react-icons";
import { cn, formatToRupiah } from "@/lib/utils";
import { AlertDialogAction } from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { buttonVariants } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/placeholder-image";
import { DialogShell } from "@/components/ui/dialog-shell";
import { db } from "@/lib/db";
import { Rating } from "@/components/rating";

interface ProductModalPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function ProductModalPage({
  params,
}: ProductModalPageProps) {
  const productId = decodeURIComponent((await params).productId);

  const product = await db.paket.findFirst({
    where: { id: productId },
  });

  if (!product) {
    notFound();
  }

  return (
    <DialogShell className="flex flex-col gap-2 overflow-visible sm:flex-row">
      <AlertDialogAction
        className={cn(
          buttonVariants({
            variant: "ghost",
            size: "icon",
            className:
              "text-foreground ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-10 h-auto w-auto shrink-0 rounded-sm bg-transparent p-0 opacity-70 transition-opacity hover:bg-transparent hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none",
          }),
        )}
        asChild
      >
        <Link href={`/product/${productId}`} replace>
          <EnterFullScreenIcon className="size-4" aria-hidden="true" />
        </Link>
      </AlertDialogAction>

      <AspectRatio ratio={16 / 9} className="w-full">
        {product.image ? (
          <Image
            src={product.image.ufsUrl ?? "/images/product-placeholder.webp"}
            alt={product.image.name ?? product.name}
            className="object-cover"
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
            fill
            loading="lazy"
          />
        ) : (
          <PlaceholderImage className="rounded-none" asChild />
        )}
      </AspectRatio>
      <div className="w-full space-y-6 p-6 sm:p-10">
        <div className="space-y-2">
          <h1 className="line-clamp-2 text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground text-base">
            Rp. {formatToRupiah(product.price)}
          </p>
          <Rating rating={Math.round(0)} />
          {product.isVisible ? (
            <p className="text-muted-foreground text-base">Ready in stock</p>
          ) : (
            <p className="text-muted-foreground text-base">
              Please contact admin
            </p>
          )}
        </div>
        <p className="text-muted-foreground line-clamp-4 text-base">
          {product.description}
        </p>
      </div>
    </DialogShell>
  );
}
