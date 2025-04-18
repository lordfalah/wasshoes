import { Illustration, NotFoundCmp } from "@/components/ui/not-found";

export default function NotFound() {
  return (
    <div className="bg-background relative flex min-h-svh w-full flex-col justify-center p-6 md:p-10">
      <div className="relative mx-auto w-full max-w-5xl">
        <Illustration className="text-foreground absolute inset-0 h-[50vh] w-full opacity-[0.04] dark:opacity-[0.08]" />
        <NotFoundCmp
          title="Page not found"
          description="Lost, this page is. In another system, it may be."
        />
      </div>
    </div>
  );
}
