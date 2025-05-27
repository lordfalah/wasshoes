import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Icons } from "@/components/icons";
import { getStoresByUserId } from "@/actions/store";

type Store = Awaited<ReturnType<typeof getStoresByUserId>>;

interface StoreCardProps {
  store: Store;
  href: string;
}

export function StoreCard({ store, href }: StoreCardProps) {
  if (!store) return null;

  return (
    <Link href={href}>
      <Card className="hover:bg-muted/25 relative h-full rounded-lg transition-colors">
        <Badge
          className={cn(
            "pointer-events-none absolute top-4 right-4 rounded-sm border-green-600/20 bg-green-100 px-2 py-0.5 font-semibold text-green-700",
          )}
        >
          Active
        </Badge>

        <CardHeader>
          <CardTitle className="line-clamp-1">{store.name}</CardTitle>
          <CardDescription className="line-clamp-1">
            {store.description?.length
              ? store.description
              : `Explore ${store.name} products`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-wrap items-center gap-4 pt-4 text-[0.8rem]">
          <div className="flex items-center">
            <Icons.product className="mr-1.5 size-3.5" aria-hidden="true" />
            {store._count.pakets} products
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
