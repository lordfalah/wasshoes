"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/tables/data-table";
import { Category, Paket } from "@prisma/client";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategorySchema, TCategorySchema } from "@/schemas/category.schema";
import { useForm } from "react-hook-form";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";

const DataTableCategorys: React.FC<{
  data: Array<Category & { pakets: Paket[] }>;
}> = ({ data }) => {
  const columns = useMemo<ColumnDef<Category & { pakets: Paket[] }>[]>(
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
        id: "Name",
        accessorKey: "name",
        header: "Name",

        cell: ({ row }) => (
          <h4 className="font-semibold">{row.original.name}</h4>
        ),
      },

      {
        id: "Description",
        accessorKey: "description",
        header: "Description",

        cell: ({ row }) => (
          <div className="w-80 text-wrap break-all">
            <p>{row.original.description}</p>
          </div>
        ),
      },

      {
        id: "Packages",
        accessorKey: "pakets",
        header: "Packages",

        cell: ({ row }) => (
          <div className="w-80 space-x-2 text-wrap break-all">
            {row.original.pakets.length > 0
              ? row.original.pakets.map(({ name, id }) => (
                  <Badge variant="secondary" key={id}>
                    {name}
                  </Badge>
                ))
              : "Doesn't have packages"}
          </div>
        ),
      },

      {
        id: "actions",
        cell: function Cell({ cell }) {
          const [isSubmitting, setIsSubmitting] = useState(false);
          const router = useRouter();
          const formCategory = useForm<TCategorySchema>({
            resolver: zodResolver(CategorySchema),
            defaultValues: {
              name: cell.row.original.name,
              description: cell.row.original.description,
            },
          });

          const onEditCategory = useCallback(
            (values: TCategorySchema) => {
              toast.promise(
                (async () => {
                  setIsSubmitting(true);
                  try {
                    console.log(values);

                    const req = await fetch(
                      `${process.env.NEXT_PUBLIC_APP_URL}/api/store/category/${cell.row.original.id}`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(values),
                      },
                    );

                    // check if fail
                    if (!req.ok) {
                      const { errors, message }: TError<TCategorySchema> =
                        await req.json();

                      if (errors) {
                        Object.keys(errors).forEach((key) => {
                          formCategory.setError(key as keyof TCategorySchema, {
                            type: "server",
                            message: errors[key as keyof TCategorySchema],
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
                  loading: "Update Category...",
                  success: "Category Update successfully!",
                  error: (err) => getErrorMessage(err),
                },
              );
            },

            // eslint-disable-next-line react-hooks/exhaustive-deps
            [cell.row.original.id, formCategory],
          );

          const onDeleteCategory = () => {
            toast.promise(
              (async () => {
                setIsSubmitting(true);
                try {
                  const req = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/api/store/category/${cell.row.original.id}`,
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
                loading: "Delete Category...",
                success: "Category delete successfully!",
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

                      <Form {...formCategory}>
                        <form
                          onSubmit={formCategory.handleSubmit(onEditCategory)}
                          className="space-y-6"
                        >
                          <FormField
                            control={formCategory.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="space-y-2.5">
                                <FormLabel>Name Category</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="wasshoes"
                                    type="text"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formCategory.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem className="space-y-2.5">
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <AutosizeTextarea
                                    placeholder="This textarea with min height 52 and max height 200."
                                    maxHeight={200}
                                    {...field}
                                  />
                                </FormControl>
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
                      <AlertDialogCancel disabled={isSubmitting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isSubmitting}
                        onClick={onDeleteCategory}
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

export default DataTableCategorys;
