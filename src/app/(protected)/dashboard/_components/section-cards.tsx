import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getRevenueComparison,
  getTotalOrders,
  getTotalPackage,
  getTotalVisitors,
} from "@/actions/main-dashboard";
import { formatToRupiah } from "@/lib/utils";
import { Fragment } from "react";

export async function SectionCards() {
  const [
    { percentageChange, thisTotal },
    totalVisitor,
    totalOrder,
    totalPackage,
  ] = await Promise.all([
    getRevenueComparison(),
    getTotalVisitors(),
    getTotalOrders(),
    getTotalPackage(),
  ]);

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            Rp. {formatToRupiah(thisTotal)}
          </CardTitle>
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              {percentageChange >= 0 ? (
                <Fragment>
                  <TrendingUpIcon className="size-3" />+{percentageChange}%
                </Fragment>
              ) : (
                <Fragment>
                  <TrendingDownIcon className="size-3" />-{percentageChange}%
                </Fragment>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>

      {/* visitors */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Visitors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalVisitor}
          </CardTitle>
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingDownIcon className="size-3" />
              -20%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Slight decline in traffic <TrendingDownIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>

      {/* orders */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalOrder}
          </CardTitle>
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +12.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            User engagement increased <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Orders processed this quarter
          </div>
        </CardFooter>
      </Card>

      {/* package */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Available Packages</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalPackage}
          </CardTitle>
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +4.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Package growth <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Reflects number of active store packages
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
