import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Shell } from "@/components/shell";

export default function InvoiceLoading() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading size="sm">Invoice</PageHeaderHeading>
        <PageHeaderDescription size="sm">
          Invoice with your cart items
        </PageHeaderDescription>
      </PageHeader>
      <Card as="section">
        <CardHeader className="flex flex-row items-center justify-between space-x-4 py-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <Separator className="mb-4" />
        <CardContent>
          <ScrollArea className="h-full">
            <div className="flex max-h-[280px] flex-col gap-5">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="space-y-3">
                  <div className="xs:flex-row flex flex-col items-start justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative size-16 overflow-hidden rounded">
                        <div className="bg-secondary flex h-full items-center justify-center">
                          <Icons.placeholder
                            className="text-muted-foreground size-4"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 self-start text-sm">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-2.5 w-20" />
                        <Skeleton className="h-2.5 w-10" />
                      </div>
                    </div>
                    <div className="xs:w-auto xs:justify-normal flex w-full items-center justify-between space-x-1">
                      <div className="flex items-center space-x-1">
                        <Skeleton className="size-8" />
                        <Skeleton className="h-8 w-14" />
                        <Skeleton className="size-8" />
                      </div>
                      <Skeleton className="size-8" />
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <Separator className="mb-4" />
        <CardFooter className="justify-between space-x-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </CardFooter>
      </Card>
    </Shell>
  );
}
