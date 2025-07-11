"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CalendarSearch,
  CheckCircle,
  CheckCircle2Icon,
  ClipboardCheck,
  Contact,
  Loader2,
  Text,
  XCircle,
} from "lucide-react";

import { useMemo } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import {
  TLaundryStatus,
  Order,
  PaketOrder,
  Store,
  TStatusOrder,
  User,
  TPriority,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatToRupiah, getEnumKeys, getPriorityIcon } from "@/lib/utils";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { LapTimerIcon } from "@radix-ui/react-icons";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { parseAsInteger, useQueryStates } from "nuqs";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { OrdersTableActionBar } from "./orders-table-action-bar";

const DataTableOrderOwner: React.FC<{
  data: Array<
    Order & { user: User; store: Store & { admin: User }; pakets: PaketOrder[] }
  >;
  total: number;
}> = ({ data, total }) => {
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
        cell: ({ row }) => row.index + 1,
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },

      {
        id: "paymentMethod",
        accessorKey: "paymentMethod",
        header: "Payment Method",

        cell: ({ row }) => (
          <h4 className="h-9 py-2 font-semibold">
            {row.original.paymentMethod}
          </h4>
        ),
        meta: {
          label: "Payment Method",
        },

        enableColumnFilter: true,
      },

      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <div className="w-40 text-wrap break-all">
            <p>{row.original.createdAt.toDateString()}</p>
          </div>
        ),

        meta: {
          label: "Date",
          placeholder: "Search date...",
          variant: "dateRange",
          icon: CalendarSearch,
        },

        enableColumnFilter: true,
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

        meta: {
          label: "Store",
        },

        enableColumnFilter: true,
      },

      {
        id: "headStore",
        accessorFn: (row) => row.store.admin.name,
        header: "Head Store",
        cell: ({ row }) => (
          <div className="w-40 text-wrap break-all">
            <p>{row.original.store.admin.name}</p>
          </div>
        ),

        meta: {
          label: "Head Store",
        },
        enableColumnFilter: true,
      },

      {
        id: "priority",
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Priority" />
        ),
        cell: ({ cell }) => {
          const priority = getEnumKeys(TPriority).find(
            (priority) => priority === cell.getValue(),
          );

          if (!priority) return null;

          const Icon = getPriorityIcon(priority as TPriority);

          return (
            <Badge variant="outline" className="py-1 [&>svg]:size-3.5">
              <Icon />
              <span className="capitalize">{priority}</span>
            </Badge>
          );
        },
        meta: {
          label: "Priority",
          variant: "multiSelect",
          options: getEnumKeys(TPriority).map((priority) => ({
            label: priority.charAt(0).toUpperCase() + priority.slice(1),
            value: priority,
            icon: getPriorityIcon(priority as TPriority),
          })),
          icon: ArrowUpDown,
        },
        enableColumnFilter: true,
      },

      {
        id: "customer",
        accessorKey: "informationCustomer",
        header: "Customer",

        cell: ({ row }) => (
          <div className="w-40 text-wrap break-all">
            {row.original.informationCustomer ? (
              <div>
                <p>
                  <span>{row.original.informationCustomer.name}</span>
                </p>
              </div>
            ) : (
              <div>
                <p>
                  <span>{row.original.user.name}</span>
                </p>
              </div>
            )}
          </div>
        ),

        meta: {
          label: "Customer",
          placeholder: "Search customer...",
          variant: "text",
          icon: Text,
        },

        enableColumnFilter: true,
        enableSorting: false,
      },

      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status Transaction" />
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

        meta: {
          label: "Total Price",
        },

        enableColumnFilter: true,
      },

      {
        id: "laundryStatus",
        accessorKey: "laundryStatus",
        header: "Status Laundry",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-muted-foreground flex gap-1 px-1.5 capitalize [&_svg]:size-3"
          >
            {row.original.laundryStatus === TLaundryStatus.COMPLETED && (
              <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
            )}
            {row.original.laundryStatus === TLaundryStatus.ON_HOLD && (
              <XCircle />
            )}
            {row.original.laundryStatus === TLaundryStatus.IN_PROGRESS && (
              <Loader2 />
            )}
            {row.original.laundryStatus === TLaundryStatus.QUALITY_CHECK && (
              <ClipboardCheck />
            )}

            {row.original.laundryStatus ===
              TLaundryStatus.READY_FOR_COLLECTION && <Contact />}
            {row.original.laundryStatus}
          </Badge>
        ),

        meta: {
          label: "Status Laundry",
        },

        enableColumnFilter: true,
      },
    ],
    [],
  );

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
  });

  const currentPage = params.page;
  const currentPerPage = params.perPage;

  const calculatedPageCount = useMemo(() => {
    if (total === 0) return 1;
    return Math.ceil(total / currentPerPage);
  }, [total, currentPerPage]);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: calculatedPageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: currentPerPage,
      },
    },
    shallow: false,
    clearOnDefault: true,
    getRowId: (row) => row.id,
  });

  return (
    <>
      <DataTable
        table={table}
        pagination={true}
        actionBar={<OrdersTableActionBar table={table} />}
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="start" />
        </DataTableToolbar>
      </DataTable>
    </>
  );
};

export default DataTableOrderOwner;
