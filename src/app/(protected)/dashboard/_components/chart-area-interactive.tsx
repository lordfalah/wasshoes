"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  // Fungsi untuk menentukan parameter query berdasarkan timeRange
  const getRangeParam = (range: string) => {
    if (range === "30d") return "30days";
    if (range === "7d") return "7days";
    return "3months"; // Default
  };

  // Menggunakan React Query untuk fetch data visitor
  const {
    data: chartData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["visitors", timeRange],
    queryFn: async () => {
      const reqVisitor = await fetch(
        `/api/visitors?range=${getRangeParam(timeRange)}`,
      );

      if (!reqVisitor.ok) {
        throw new Error("Error Visitors");
      }
      return await reqVisitor.json();
    },

    refetchOnWindowFocus: false, // Tidak refetch saat window fokus
  });

  return (
    <React.Fragment>
      {isLoading ? (
        <Skeleton>
          <Card className="@container/card">
            <CardContent className="grid h-60 place-content-center">
              <LoaderCircle size={35} className="animate-spin" />
            </CardContent>
          </Card>
        </Skeleton>
      ) : (
        <Card className="@container/card">
          {isError && (
            <CardContent className="grid h-60 place-content-center">
              <h4 className="text-2xl font-semibold text-red-400">
                Something when error!
              </h4>
            </CardContent>
          )}

          {chartData?.data.length > 0 ? (
            <React.Fragment>
              <CardHeader className="relative">
                <CardTitle>Total Visitors</CardTitle>
                <CardDescription>
                  <span className="hidden @[540px]/card:block">
                    Total for the last 3 months
                  </span>
                  <span className="@[540px]/card:hidden">Last 3 months</span>
                </CardDescription>
                <div className="absolute top-4 right-4">
                  <ToggleGroup
                    type="single"
                    value={timeRange}
                    onValueChange={setTimeRange}
                    variant="outline"
                    className="hidden @[767px]/card:flex"
                  >
                    <ToggleGroupItem value="90d" className="h-8 px-2.5">
                      Last 3 months
                    </ToggleGroupItem>
                    <ToggleGroupItem value="30d" className="h-8 px-2.5">
                      Last 30 days
                    </ToggleGroupItem>
                    <ToggleGroupItem value="7d" className="h-8 px-2.5">
                      Last 7 days
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                      className="flex w-40 @[767px]/card:hidden"
                      aria-label="Select a value"
                    >
                      <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="90d" className="rounded-lg">
                        Last 3 months
                      </SelectItem>
                      <SelectItem value="30d" className="rounded-lg">
                        Last 30 days
                      </SelectItem>
                      <SelectItem value="7d" className="rounded-lg">
                        Last 7 days
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[250px] w-full"
                >
                  <AreaChart data={chartData.data}>
                    <defs>
                      <linearGradient
                        id="fillDesktop"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-desktop)"
                          stopOpacity={1.0}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-desktop)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="fillMobile"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-mobile)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-mobile)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                          }}
                          indicator="dot"
                        />
                      }
                    />
                    <Area
                      dataKey="mobile"
                      type="natural"
                      fill="url(#fillMobile)"
                      stroke="var(--color-mobile)"
                      stackId="a"
                    />
                    <Area
                      dataKey="desktop"
                      type="natural"
                      fill="url(#fillDesktop)"
                      stroke="var(--color-desktop)"
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </React.Fragment>
          ) : (
            <CardContent className="grid h-60 place-content-center">
              <h4 className="text-2xl font-semibold text-yellow-300">
                Data visitor doesn&apos;t have!
              </h4>
            </CardContent>
          )}
        </Card>
      )}
    </React.Fragment>
  );
}
