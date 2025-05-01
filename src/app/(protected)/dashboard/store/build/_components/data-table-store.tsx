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
import { useMemo } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/tables/data-table";
import { Role, User } from "@prisma/client";
import { TStoreSchemaServer } from "@/schemas/store";
import { Scroller } from "@/components/ui/scroller";
import Image from "next/image";

const DataTableStore: React.FC<{
  data: (TStoreSchemaServer & {
    id: string;
    user: (User & { role: Role[] })[];
  })[];
}> = ({ data }) => {
  const columns = useMemo<
    ColumnDef<
      TStoreSchemaServer & { id: string; user: (User & { role: Role[] })[] }
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

        cell: ({ row }) => <p>{row.original.name}</p>,
      },

      {
        id: "BannerStore",
        accessorKey: "bannerImgs",
        header: () => <p className="text-center">Banner Store</p>,

        cell: ({ row }) => (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(500px,1fr))] gap-x-5">
            <div className="w-full">
              <Scroller orientation="horizontal" className="p-4" asChild>
                <div className="flex items-center gap-2.5">
                  {row.original.bannerImgs.map(({ ufsUrl, name }, idx) => (
                    <Image
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
        id: "User",
        accessorKey: "user",
        header: "User",

        cell: ({ row }) => (
          <div>
            {row.original.user.length > 0
              ? row.original.user.map(({ name }, idx) => (
                  <p key={idx}>{name}</p>
                ))
              : "Doesn't have user"}
          </div>
        ),
      },

      {
        id: "actions",
        cell: function Cell() {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  Delete
                </DropdownMenuItem>
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

  console.log(data);

  return (
    <>
      <DataTable table={table} pagination={false} />
    </>
  );
};

export default DataTableStore;
