"use client";

import { SelectTrigger } from "@radix-ui/react-select";
import type { Table } from "@tanstack/react-table";
import { ArrowUp, CheckCircle2, Download } from "lucide-react";
import * as React from "react";

import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/data-table/data-table-action-bar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  Order,
  Paket,
  PaketOrder,
  Store,
  TLaundryStatus,
  TPriority,
  User,
} from "@prisma/client";
import { getEnumKeys } from "@/lib/utils";
import { exportTableToCSV } from "@/lib/export";
import { updateOrders } from "@/actions/order";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const actions = ["update-laundry-status", "update-priority", "export"] as const;

type Action = (typeof actions)[number];

interface OrderTableActionBarProps {
  table: Table<
    Order & {
      user: User;
      store: Store;
      pakets: Array<PaketOrder & { paket: Paket }>;
    }
  >;
}

export function OrdersTableActionBarEmployer({
  table,
}: OrderTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onOrderUpdate = React.useCallback(
    ({
      field,
      value,
    }: {
      field: "laundryStatus" | "priority";
      value: TLaundryStatus | TPriority;
    }) => {
      setCurrentAction(
        field === "laundryStatus" ? "update-laundry-status" : "update-priority",
      );
      startTransition(async () => {
        const { error } = await updateOrders({
          ids: rows.map((row) => row.original.id),
          [field]: value,
        });

        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Orders updated");
      });
    },
    [rows],
  );

  const onTaskExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <Select
          onValueChange={(value: TLaundryStatus) =>
            onOrderUpdate({ field: "laundryStatus", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Update Status Laundry"
              isPending={getIsActionPending("update-laundry-status")}
            >
              <CheckCircle2 />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {getEnumKeys(TLaundryStatus).map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value: TPriority) =>
            onOrderUpdate({ field: "priority", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              size="icon"
              tooltip="Update priority"
              isPending={getIsActionPending("update-priority")}
            >
              <ArrowUp />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {getEnumKeys(TPriority).map((priority) => (
                <SelectItem
                  key={priority}
                  value={priority}
                  className="capitalize"
                >
                  {priority}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <DataTableActionBarAction
          size="icon"
          tooltip="Export Orders"
          isPending={getIsActionPending("export")}
          onClick={onTaskExport}
        >
          <Download />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
