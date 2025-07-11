"use client";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  BadgeCheck,
  BadgeX,
  Users,
  UserCog,
  Text,
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
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { TDataUsersRole } from "../page";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { roles, RoleSchema } from "@/schemas";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Fragment, useState } from "react";
import { TError } from "@/types/route-api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/handle-error";
import { UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { parseAsInteger, useQueryStates } from "nuqs";

const DataTableUser: React.FC<{ data: TDataUsersRole[]; total: number }> = ({
  data,
  total,
}) => {
  const columns = useMemo<ColumnDef<TDataUsersRole>[]>(
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
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),

        meta: {
          label: "Name",
          placeholder: "Search name...",
          variant: "text",
          icon: Text,
        },

        enableColumnFilter: true,
      },

      {
        id: "profile",
        accessorKey: "image",

        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Profile" />
        ),

        cell: ({ row }) => (
          <div>
            <Image
              src={
                row.original.image
                  ? row.original.image
                  : "https://robohash.org/unknown.png?size=350x350"
              }
              alt={row.original.email as string}
              className="size-10 rounded-full"
              width={100}
              height={100}
            />
          </div>
        ),

        enableSorting: false,
        enableHiding: false,
      },

      {
        id: "email",
        accessorKey: "email",

        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),

        cell: ({ row }) => (
          <div className="flex gap-x-2">
            {row.original.email}{" "}
            {row.original.emailVerified ? (
              <BadgeCheck className="fill-blue-600" size={20} />
            ) : (
              <BadgeX className="fill-red-400" size={20} />
            )}
          </div>
        ),

        enableColumnFilter: true,
      },

      {
        id: "role",
        accessorKey: "role",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),

        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-muted-foreground flex gap-1 px-1.5 capitalize [&_svg]:size-3"
          >
            {row.original.role.name}
          </Badge>
        ),

        meta: {
          label: "Role",
          variant: "multiSelect",
          options: [
            {
              label: "Admin",
              value: UserRole.ADMIN,
              icon: UserCog,
            },
            {
              label: "User",
              value: UserRole.USER,
              icon: Users,
            },
          ],
        },
        enableColumnFilter: true,
      },

      {
        id: "actions",
        cell: function Cell({ cell }) {
          const router = useRouter();
          const [isSubmitting, setIsSubmitting] = useState(false);
          const form = useForm<z.infer<typeof RoleSchema>>({
            resolver: zodResolver(RoleSchema),
            defaultValues: {
              role: cell.row.original.role.name,
            },
          });

          const onSubmit = (values: z.infer<typeof RoleSchema>) => {
            toast.promise(
              (async () => {
                setIsSubmitting(true);
                try {
                  const req = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/roles/${cell.row.original.id}`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        ...values,
                      }),
                    },
                  );

                  // check if fail
                  if (!req.ok) {
                    const {
                      errors,
                      message,
                    }: TError<z.infer<typeof RoleSchema>> = await req.json();

                    if (errors) {
                      Object.keys(errors).forEach((key) => {
                        form.setError(key as keyof z.infer<typeof RoleSchema>, {
                          type: "server",
                          message:
                            errors[key as keyof z.infer<typeof RoleSchema>],
                        });
                      });
                    }

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
                loading: "Saving Role...",
                success: "Role saved successfully!",
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full text-left"
                      variant="ghost"
                      type="button"
                    >
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        Update Role User : {cell.row.original.id}
                      </DialogTitle>
                      <DialogDescription>
                        Make changes to your Management role here. Click save
                        when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-6"
                        >
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Role</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between",
                                          !field.value &&
                                            "text-muted-foreground",
                                        )}
                                      >
                                        {field.value
                                          ? roles.find(
                                              (role) =>
                                                role.value === field.value,
                                            )?.label
                                          : "Select Role"}
                                        <ChevronsUpDown className="opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    style={{ pointerEvents: "auto" }}
                                    className="w-[200px] p-0"
                                    align="end"
                                  >
                                    <Command>
                                      <CommandInput
                                        placeholder="Search Role..."
                                        className="h-9"
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          No role found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {roles.map((role) => (
                                            <CommandItem
                                              value={role.label}
                                              key={role.value}
                                              onSelect={() => {
                                                form.setValue(
                                                  "role",
                                                  role.value,
                                                );
                                              }}
                                            >
                                              {role.label}
                                              <Check
                                                className={cn(
                                                  "ml-auto",
                                                  role.value === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                                )}
                                              />
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  This is the role that will be used in the
                                  dashboard.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <Fragment>
                                <Loader2 className="animate-spin" />
                                Please wait
                              </Fragment>
                            ) : (
                              "Submit"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </DialogContent>
                </Dialog>

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
      sorting: [{ id: "name", desc: true }],
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
      <DataTable table={table} pagination={true}>
        <DataTableToolbar table={table} />
      </DataTable>
    </>
  );
};

export default DataTableUser;
