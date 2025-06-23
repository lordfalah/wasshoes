"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  CheckCircle,
  CheckCircle2Icon,
  ChevronsUpDown,
  ClipboardCheck,
  Contact,
  Loader2,
  MoreHorizontal,
  Text,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Fragment, useMemo, useTransition } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/tables/data-table";
import {
  TLaundryStatus,
  Order,
  Paket,
  PaketOrder,
  Store,
  TStatusOrder,
  User,
} from "@prisma/client";
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
import { Badge } from "@/components/ui/badge";

import { calculateOrderTotals, cn, formatToRupiah } from "@/lib/utils";
import { DataTableToolbar } from "@/components/tables/data-table-toolbar";
import { LapTimerIcon } from "@radix-ui/react-icons";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { Scroller } from "@/components/ui/scroller";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { orderSchema, TOrderSchema } from "@/schemas/order.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateStatusLaundry } from "@/actions/order";
import { getErrorMessage } from "@/lib/handle-error";

const DataTableOrderEmployer: React.FC<{
  data: Array<
    Order & {
      user: User;
      store: Store;
      pakets: Array<PaketOrder & { paket: Paket }>;
    }
  >;
}> = ({ data }) => {
  const columns = useMemo<
    ColumnDef<
      Order & {
        user: User;
        store: Store;
        pakets: Array<PaketOrder & { paket: Paket }>;
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
        id: "Payment",
        accessorKey: "paymentMethod",
        header: "Payment Method",

        cell: ({ row }) => (
          <h4 className="font-semibold">{row.original.paymentMethod}</h4>
        ),
      },

      {
        id: "customer",
        accessorKey: "informationCustomer",
        header: "Customer",

        cell: ({ row }) => (
          <div className="w-40 text-wrap break-all">
            {row.original.informationCustomer ? (
              <div>
                <span className="font-semibold">
                  {row.original.informationCustomer.name}
                </span>
              </div>
            ) : (
              <div>
                <span className="font-semibold">
                  {row.original.user.name
                    ? row.original.user.name
                    : `${row.original.user.firstName} ${row.original.user.lastName}`}
                </span>
              </div>
            )}
          </div>
        ),

        meta: {
          label: "Customer",
          placeholder: "Search Customer...",
          variant: "text",
          icon: Text,
        },

        enableColumnFilter: true,
      },

      {
        id: "namePaket",
        accessorKey: "pakets",
        header: "Name Paket",
        cell: ({ row }) => (
          <div className="w-40 text-wrap break-all">
            {row.original.pakets.map(({ paket, quantity, id }) => (
              <p key={id}>
                {paket.name} <span className="font-medium">{quantity}</span>
              </p>
            ))}
          </div>
        ),
      },

      {
        id: "amountPrice",
        accessorFn: (order) => order.pakets,
        header: "Amount Price",
        cell: ({ row }) => {
          const itemsForCalculation = row.original.pakets.map((paketOrder) => {
            return {
              price: Number(paketOrder.paket.price), // Pastikan price adalah number
              quantity: paketOrder.quantity,
              // Pastikan priceOrder adalah number atau null/undefined
              priceOrder:
                paketOrder.priceOrder !== undefined &&
                paketOrder.priceOrder !== null
                  ? Number(paketOrder.priceOrder)
                  : undefined, // Atau null, tergantung preferensi calculateOrderTotals Anda
            };
          });

          const { subtotalPrice, adjustmentText } =
            calculateOrderTotals(itemsForCalculation);

          return (
            <div className="w-44 text-wrap break-all">
              <p>{adjustmentText ?? ""}</p>
              <p>
                {adjustmentText &&
                  `sub total price Rp. ${formatToRupiah(subtotalPrice)}`}
              </p>
            </div>
          );
        },
      },

      {
        id: "totalPrice",
        accessorKey: "pakets",
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
        id: "status_laundry",
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
      },

      {
        id: "shoesImages",
        accessorKey: "shoesImages",
        header: () => <p className="text-center">Picture Shoes</p>,

        cell: ({ row }) => (
          <div className="gap-x-5">
            <Scroller orientation="horizontal" className="p-4" asChild>
              <div className="flex items-center justify-center gap-2.5">
                {row.original.shoesImages.map(({ ufsUrl, name }, idx) => (
                  <Image
                    priority
                    key={idx}
                    src={ufsUrl}
                    alt={name}
                    width={180}
                    height={180}
                    className="size-28 rounded-md object-cover"
                  />
                ))}
              </div>
            </Scroller>
          </div>
        ),
      },

      {
        id: "actions",
        cell: function Cell({ cell }) {
          const router = useRouter();
          const [pending, startTransition] = useTransition();

          const form = useForm<TOrderSchema>({
            resolver: zodResolver(orderSchema),
            defaultValues: {
              statusLaundry: cell.row.original.laundryStatus,
            },
          });

          const onSubmit = (values: TOrderSchema) => {
            toast.promise(
              new Promise<void>((resolve, reject) => {
                startTransition(async () => {
                  try {
                    const { error: updateError } = await updateStatusLaundry(
                      values.statusLaundry,
                      cell.row.original.id,
                    );

                    if (updateError) {
                      throw new Error(updateError);
                    }

                    router.refresh(); // Refresh router untuk update data di UI
                    resolve(); // Resolve promise jika berhasil
                  } catch (error) {
                    console.error("Submission error:", error); // Gunakan console.error untuk error
                    reject(error); // Reject promise jika ada error
                  }
                });
              }),
              {
                loading: "Updating status...", // Pesan loading untuk toast
                success: "Status updated successfully!",
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
                      className="w-full cursor-pointer text-center"
                      variant="ghost"
                      type="button"
                    >
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        Update Status Laundry :{" "}
                        {cell.row.original.informationCustomer
                          ? cell.row.original.informationCustomer.name
                          : `${
                              cell.row.original.user.name
                                ? cell.row.original.user.name
                                : `${cell.row.original.user.firstName} ${cell.row.original.user.lastName}`
                            }`}
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
                          className="space-y-8"
                        >
                          <FormField
                            control={form.control}
                            name="statusLaundry"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Laundry Status</FormLabel>
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
                                          ? // Cari label berdasarkan nilai field.value
                                            // Anda bisa pakai helper object, atau langsung string replace
                                            field.value.replace(/_/g, " ") // Mengubah AWAITING_PROCESSING jadi AWAITING PROCESSING
                                          : "Select laundry status"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput
                                        placeholder="Search status..."
                                        className="h-9"
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          No status found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {/* Loop melalui nilai-nilai dari LaundryStatus enum */}
                                          {Object.values(TLaundryStatus).map(
                                            (status) => (
                                              <CommandItem
                                                value={status} // Value harus berupa string dari enum
                                                key={status}
                                                onSelect={() => {
                                                  form.setValue(
                                                    "statusLaundry",
                                                    status,
                                                  );
                                                  form.trigger("statusLaundry"); // Untuk memastikan validasi segera
                                                }}
                                              >
                                                {status.replace(/_/g, " ")}{" "}
                                                {/* Tampilan label yang lebih rapi */}
                                                <Check
                                                  className={cn(
                                                    "ml-auto h-4 w-4",
                                                    status === field.value
                                                      ? "opacity-100"
                                                      : "opacity-0",
                                                  )}
                                                />
                                              </CommandItem>
                                            ),
                                          )}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Select the current processing status of the
                                  laundry order.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={pending}>
                            {pending ? (
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
    debounceMs: 1000,
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
};

export default DataTableOrderEmployer;
