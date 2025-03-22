import * as React from "react";
import Link from "next/link";
import { DashboardIcon, ExitIcon, GearIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { auth, signOut } from "@/auth";

interface AuthDropdownProps
  extends React.ComponentPropsWithRef<typeof DropdownMenuTrigger>,
    ButtonProps {}

export async function AuthDropdown({ className, ...props }: AuthDropdownProps) {
  const session = await auth();

  if (!session) {
    return (
      <Button size="sm" className={cn(className)} {...props} asChild>
        <Link href="/auth/login">
          Sign In
          <span className="sr-only">Sign In</span>
        </Link>
      </Button>
    );
  }

  const initials = `${session.user.name?.charAt(0) ?? ""}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className={cn("size-8 rounded-full", className)}
          {...props}
        >
          <Avatar className="size-8">
            {session.user.image && (
              <AvatarImage
                src={session.user.image}
                alt={session.user.name ?? ""}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{initials}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {session.user.email ?? ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <React.Suspense
          fallback={
            <div className="flex flex-col space-y-1.5 p-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-sm" />
              ))}
            </div>
          }
        >
          <AuthDropdownGroup />
        </React.Suspense>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <ExitIcon className="mr-2 size-4" aria-hidden="true" />
            <button
              type="submit"
              className="flex w-full items-center justify-between"
            >
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function AuthDropdownGroup() {
  return (
    <DropdownMenuGroup>
      <DropdownMenuItem asChild>
        <Link href={"/onboarding"}>
          <DashboardIcon className="mr-2 size-4" aria-hidden="true" />
          Dashboard
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/billing">
          <Icons.credit className="mr-2 size-4" aria-hidden="true" />
          Billing
          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/settings">
          <GearIcon className="mr-2 size-4" aria-hidden="true" />
          Settings
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
