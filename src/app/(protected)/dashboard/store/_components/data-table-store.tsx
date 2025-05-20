"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/tables/data-table";
import { Role, User } from "@prisma/client";
import { TStoreSchemaServer } from "@/schemas/store.schema";
import { Scroller } from "@/components/ui/scroller";
import Image from "next/image";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/handle-error";
import { TError } from "@/types/route-api";

const DataTableStore: React.FC<{
  data: (TStoreSchemaServer & {
    id: string;
    users: (User & { role: Role[] })[];
  })[];
}> = ({ data }) => {
  const columns = useMemo<
    ColumnDef<
      TStoreSchemaServer & { id: string; users: (User & { role: Role[] })[] }
    >[]
  >(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },

      {
        id: "Store",
        accessorKey: "name",
        header: "Name Store",

        cell: ({ row }) => (
          <div>
            <h3 className="font-semibold">{row.original.name}</h3>
            <p className="w-72 text-wrap break-all">
              {row.original.description}
            </p>
          </div>
        ),
      },

      {
        id: "BannerStore",
        accessorKey: "bannerImgs",
        header: () => <p className="text-center">Banner Store</p>,

        cell: ({ row }) => (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(500px,1fr))] gap-x-5">
            <div className="w-full">
              <Scroller orientation="horizontal" className="p-4" asChild>
                <div className="flex items-center justify-center gap-2.5">
                  {row.original.bannerImgs.map(({ ufsUrl, name }, idx) => (
                    <Image
                      priority
                      key={idx}
                      src={ufsUrl}
                      alt={name}
                      width={180}
                      height={180}
                      className="h-40 w-60 rounded-md"
                    />
                  ))}
                </div>
              </Scroller>
            </div>
          </div>
        ),
      },

      {
        id: "MapEmbed",
        accessorKey: "mapEmbed",
        header: () => <p className="text-center">Map Location</p>,
        cell: ({ row }) => (
          <div className="p-4">
            <iframe
              src={row.original.mapEmbed}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-[300px] rounded-2xl border-0 border-none"
            />
          </div>
        ),
      },

      {
        id: "User",
        accessorKey: "user",
        header: "User",

        cell: ({ row }) => (
          <div>
            {row.original.users.length > 0
              ? row.original.users.map(({ name }, idx) => (
                  <p key={idx}>{name}</p>
                ))
              : "Doesn't have user"}
          </div>
        ),
      },

      {
        id: "actions",
        cell: function Cell({ cell }) {
          const [isSubmitting, setIsSubmitting] = useState(false);
          const router = useRouter();

          const onDeleteStore = () => {
            toast.promise(
              (async () => {
                setIsSubmitting(true);
                try {
                  const req = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/store/${cell.row.original.id}`,
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  // check if fail
                  if (!req.ok) {
                    const {
                      errors,
                      message,
                    }: TError<{ code: number; description: string }> =
                      await req.json();
                    console.log(errors);

                    throw new Error(message);
                  }

                  router.refresh();
                } catch (error) {
                  console.log({ error });
                  throw error;
                } finally {
                  setIsSubmitting(false);
                }
              })(),
              {
                loading: "Delete store...",
                success: "Store delete successfully!",
                error: (err) => getErrorMessage(err),
              },
            );
          };

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Button variant="ghost" asChild>
                    <Link href={`/dashboard/store/${cell.row.id}`}>Edit</Link>
                  </Button>
                </DropdownMenuItem>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full hover:bg-red-400/20 hover:text-red-500"
                    >
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isSubmitting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isSubmitting}
                        onClick={onDeleteStore}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 32,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "name", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.id,
  });

  return (
    <>
      <DataTable table={table} pagination={false} />
    </>
  );
};

export default DataTableStore;
