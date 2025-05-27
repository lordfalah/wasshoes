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
import { Fragment, useMemo, useState } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/tables/data-table";
import { Category, Paket, Store } from "@prisma/client";
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
import { Badge } from "@/components/ui/badge";
import { formatToRupiah } from "@/lib/utils";

const DataTablePackage: React.FC<{
  data: Array<
    Paket & {
      category: Category;
      stores: Store[];
    }
  >;
}> = ({ data }) => {
  const columns = useMemo<
    ColumnDef<
      Paket & {
        category: Category;
        stores: Store[];
      }
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
        id: "Package",
        accessorKey: "description",
        header: "Name Package",

        cell: ({ row }) => (
          <div className="w-80 text-wrap break-all">
            <h4 className="font-semibold">{row.original.name}</h4>
            <p>{row.original.description}</p>
          </div>
        ),
      },

      {
        id: "Image",
        accessorKey: "image",
        header: () => <p className="text-center">Picture Package</p>,

        cell: ({ row }) => (
          <div className="relative h-40 w-80 rounded-md">
            <Image
              priority
              src={row.original.image.ufsUrl}
              alt={row.original.image.name}
              fill
              style={{
                objectFit: "contain",
                objectPosition: "center",
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ),
      },

      {
        id: "Price",
        accessorKey: "price",
        header: "Price",

        cell: ({ row }) => (
          <div>
            <p>Rp. {formatToRupiah(row.original.price)}</p>
          </div>
        ),
      },

      {
        id: "Category",
        accessorKey: "category",
        header: "Category",

        cell: ({ row }) => (
          <div>
            {row.original.categoryId ? (
              <Fragment>
                <h4 className="font-semibold">{row.original.category.name}</h4>
                <p>{row.original.category.description}</p>
              </Fragment>
            ) : (
              <p>Doesn&apos;t have category</p>
            )}
          </div>
        ),
      },

      {
        id: "Stores",
        accessorKey: "stores",
        header: "Stores",

        cell: ({ row }) => (
          <div className="space-x-2.5">
            {row.original.stores.length > 0
              ? row.original.stores.map(({ name, id }) => (
                  <Badge key={id}>{name}</Badge>
                ))
              : "Package Doesn't have store"}
          </div>
        ),
      },

      {
        id: "actions",
        cell: function Cell({ cell }) {
          const [isSubmitting, setIsSubmitting] = useState(false);
          const router = useRouter();

          const onDeletePackage = () => {
            toast.promise(
              (async () => {
                setIsSubmitting(true);
                try {
                  const req = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/store/package/${cell.row.original.id}`,
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
                    <Link href={`/dashboard/package/${cell.row.id}`}>Edit</Link>
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
                        onClick={onDeletePackage}
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

export default DataTablePackage;
