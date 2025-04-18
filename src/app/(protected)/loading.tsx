import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <Skeleton className="grid h-dvh w-full place-content-center">
      <Loader className="animate-spin" size={50} />
    </Skeleton>
  );
}
