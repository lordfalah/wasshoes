"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  CheckCircle2Icon,
  Loader2,
  MoreHorizontal,
  Text,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/tables/data-table";
import { Order, PaketOrder, Store, TStatusOrder, User } from "@prisma/client";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatToRupiah } from "@/lib/utils";
import { DataTableToolbar } from "@/components/tables/data-table-toolbar";
import { LapTimerIcon } from "@radix-ui/react-icons";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";

const DataTableOrder: React.FC<{
  data: Array<
    Order & { user: User; store: Store & { admin: User }; pakets: PaketOrder[] }
  >;
}> = ({ data }) => {
  const columns = useMemo<
    ColumnDef<
      Order & {
        user: User;
        store: Store & { admin: User };
        pakets: PaketOrder[];
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
        id: "no",
        header: "No",
        cell: ({ row }) => row.index + 1, // nomor dalam halaman
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },

      {
        id: "Payment",
        accessorKey: "paymentMethod",
        header: "Payment Method",

        cell: ({ row }) => (
          <h4 className="font-semibold">{row.original.paymentMethod}</h4>
        ),
      },

      {
        id: "store",
        accessorKey: "store",
        header: "Store",

        cell: ({ row }) => (
          <div className="w-52 text-wrap break-all">
            <p>{row.original.store.name}</p>
          </div>
        ),
      },

      {
        id: "nameAdmin",
        accessorFn: (row) => row.store.admin.name,
        header: "Head Store",
        cell: ({ row }) => (
          <div className="w-40 text-wrap break-all">
            <p>{row.original.store.admin.name}</p>
          </div>
        ),

        meta: {
          label: "Head Store",
          placeholder: "Search Head Store...",
          variant: "text",
          icon: Text,
        },

        enableColumnFilter: true,
      },

      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),

        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-muted-foreground flex gap-1 px-1.5 capitalize [&_svg]:size-3"
          >
            {row.original.status === TStatusOrder.SETTLEMENT && (
              <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
            )}
            {row.original.status === TStatusOrder.FAILURE && <XCircle />}
            {row.original.status === TStatusOrder.PENDING && <Loader2 />}
            {row.original.status === TStatusOrder.EXPIRE && <LapTimerIcon />}
            {row.original.status}
          </Badge>
        ),

        meta: {
          label: "Status",
          variant: "multiSelect",
          options: [
            {
              label: "Settlement",
              value: TStatusOrder.SETTLEMENT,
              icon: CheckCircle,
            },
            {
              label: "Failure",
              value: TStatusOrder.FAILURE,
              icon: XCircle,
            },
            {
              label: "Pending",
              value: TStatusOrder.PENDING,
              icon: Loader2,
            },
            {
              label: "Expire",
              value: TStatusOrder.EXPIRE,
              icon: LapTimerIcon as never,
            },
          ],
        },
        enableColumnFilter: true,
      },

      {
        id: "totalPrice",
        accessorKey: "totalPrice",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total Price" />
        ),

        cell: ({ row }) => (
          <div className="w-28 text-wrap break-all">
            <p>Rp. {formatToRupiah(row.original.totalPrice)}</p>
          </div>
        ),
      },

      {
        id: "customer",
        accessorKey: "informationCustomer",
        header: "Customer",

        cell: ({ row }) => (
          <div className="w-80 text-wrap break-all">
            {row.original.informationCustomer ? (
              <div>
                <p>
                  Assign By Admin{" "}
                  <span className="font-semibold">
                    {row.original.user.name}
                  </span>
                </p>
                <p>
                  Customer{" "}
                  <span className="font-semibold">
                    {row.original.informationCustomer.first_name}
                    {row.original.informationCustomer.last_name}
                  </span>
                </p>
              </div>
            ) : (
              <div>
                <p>
                  <span className="font-semibold">
                    {row.original.user.name}
                  </span>
                </p>
              </div>
            )}
          </div>
        ),
      },

      {
        id: "actions",
        cell: function Cell({}) {
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full">
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                          Make changes to your profile here. Click save when
                          you&apos;re done.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
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
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Delete</AlertDialogAction>
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
      sorting: [{ id: "status", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    shallow: false,
    throttleMs: 1000,
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
};

export default DataTableOrder;
