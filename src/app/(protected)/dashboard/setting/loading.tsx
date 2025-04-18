import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <Skeleton className="grid h-full w-full place-content-center">
      <LoaderCircle className="animate-spin" size={50} />
    </Skeleton>
  );
}
