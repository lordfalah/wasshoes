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
  MessageCircleIcon,
  MoreHorizontal,
  Text,
  XCircle,
} from "lucide-react";

import { useMemo } from "react";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import {
  TLaundryStatus,
  Order,
  Paket,
  PaketOrder,
  Store,
  TStatusOrder,
  User,
  TPriority,
} from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  calculateOrderTotals,
  formatToRupiah,
  getEnumKeys,
  getPriorityIcon,
} from "@/lib/utils";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { LapTimerIcon } from "@radix-ui/react-icons";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Scroller } from "@/components/ui/scroller";
import Image from "next/image";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { parseAsInteger, useQueryStates } from "nuqs";
import { OrdersTableActionBarEmployer } from "./orders-table-action-bar-employer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TLaundryStatusDisplay = {
  AWAITING_PROCESSING: "Menunggu untuk diproses/dikerjakan",
  IN_PROGRESS: "Sedang dalam pengerjaan (laundry)",
  QUALITY_CHECK: "Pemeriksaan kualitas (setelah pengerjaan selesai)",
  READY_FOR_COLLECTION:
    "Pesanan sudah siap dan menunggu diambil oleh pelanggan di lokasi",
  COMPLETED:
    "Pesanan telah diambil oleh pelanggan dan dianggap selesai sepenuhnya",
  ON_HOLD:
    "Ditahan karena alasan tertentu (misal: menunggu konfirmasi pelanggan, masalah pada sepatu)",
};

const DataTableOrderEmployer: React.FC<{
  data: Array<
    Order & {
      user: User;
      store: Store;
      pakets: Array<PaketOrder & { paket: Paket }>;
    }
  >;
  total: number;
}> = ({ data, total }) => {
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
        id: "paymentMethod",
        accessorKey: "paymentMethod",
        header: "Payment Method",

        cell: ({ row }) => (
          <h4 className="font-semibold">{row.original.paymentMethod}</h4>
        ),
        meta: {
          label: "Payment Method",
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
        enableSorting: false,
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

        meta: {
          label: "Name Paket",
        },
        enableSorting: false,
        enableHiding: false,
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
              <p>{adjustmentText ?? "Tidak ada Diskon/Biaya Tambahan"}</p>
              <p>
                {adjustmentText &&
                  `sub total price Rp. ${formatToRupiah(subtotalPrice)}`}
              </p>
            </div>
          );
        },

        enableSorting: false,
        enableHiding: false,
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

        meta: {
          label: "Total Price",
        },
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

      {
        id: "shoesImages",
        accessorKey: "shoesImages",
        header: () => <p className="text-center">Picture Shoes</p>,

        cell: ({ row }) => (
          <div className="gap-x-5">
            <Scroller orientation="horizontal" className="p-4" asChild>
              <div className="flex w-72 items-center gap-2.5 md:w-96">
                {row.original.shoesImages.map(({ ufsUrl, name }, idx) => (
                  <Image
                    priority
                    key={idx}
                    src={ufsUrl}
                    alt={name}
                    width={180}
                    height={180}
                    className="flex h-32 w-[180px] shrink-0 flex-col items-center justify-center rounded-md object-cover"
                  />
                ))}
              </div>
            </Scroller>
          </div>
        ),

        meta: {
          label: "Picture Shoes",
        },

        enableSorting: false,
      },

      {
        id: "actions",
        cell: function Cell({ cell }) {
          const originalData = cell.row.original;

          // Mendapatkan nama pelanggan
          const customerName = originalData.informationCustomer
            ? originalData.informationCustomer.name
            : originalData.user.name
              ? originalData.user.name
              : `${originalData.user.firstName || ""} ${originalData.user.lastName || ""}`.trim();

          // Mendapatkan nomor telepon pelanggan
          const customerPhone = originalData.informationCustomer
            ? originalData.informationCustomer.phone
            : originalData.user.phone; // Fallback to user.phone if informationCustomer is null

          // Menerjemahkan status laundry
          const laundryStatusText =
            TLaundryStatusDisplay[originalData.laundryStatus] ||
            originalData.laundryStatus;

          // Menentukan status pembayaran (Lunas/Belum Lunas)
          let paymentStatusText;
          if (
            originalData.status === "SETTLEMENT" ||
            originalData.status === "CAPTURE"
          ) {
            paymentStatusText = "Lunas";
          } else {
            paymentStatusText = "Belum Lunas";
          }

          // Mendapatkan nama toko
          const storeName = originalData.store
            ? originalData.store.name
            : "Toko tidak diketahui";

          // Mengambil URL gambar pertama jika ada
          const imageUrl =
            originalData.shoesImages && originalData.shoesImages.length > 0
              ? originalData.shoesImages[0].ufsUrl
              : null;

          // Membuat pesan WhatsApp yang lebih lengkap
          let message = `Halo ${customerName},\n`;
          message += `Pesanan Anda (ID: ${originalData.id}) di ${storeName}.\n`;
          message += `Status Pembayaran: ${paymentStatusText}.\n`;
          message += `Status Pengerjaan Laundry: ${laundryStatusText}.`;

          if (imageUrl) {
            message += `\n\nLihat gambar sepatu Anda: ${imageUrl}`;
          }

          // Mengenkode pesan agar aman untuk URL
          const encodedMessage = encodeURIComponent(message);

          // Membuat link WhatsApp jika nomor telepon tersedia
          const linkWA = customerPhone
            ? `https://wa.me/${customerPhone}?text=${encodedMessage}`
            : null;

          return linkWA ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" asChild>
                  <Link
                    href={linkWA}
                    target="_blank"
                    className="cursor-pointer"
                  >
                    Send To Wa <MessageCircleIcon size={20} />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null;
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
    <DataTable
      table={table}
      pagination={true}
      actionBar={<OrdersTableActionBarEmployer table={table} />}
    >
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} align="start" />
      </DataTableToolbar>
    </DataTable>
  );
};

export default DataTableOrderEmployer;
