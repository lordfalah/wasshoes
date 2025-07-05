import { clsx, type ClassValue } from "clsx";
import { env } from "process";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function formatPrice(
  price: number | string,
  opts: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency ?? "USD",
    notation: opts.notation ?? "compact",
    ...opts,
  }).format(Number(price));
}

export function formatNumber(
  number: number | string,
  opts: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat("en-US", {
    style: opts.style ?? "decimal",
    notation: opts.notation ?? "standard",
    minimumFractionDigits: opts.minimumFractionDigits ?? 0,
    maximumFractionDigits: opts.maximumFractionDigits ?? 2,
    ...opts,
  }).format(Number(number));
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("en-US", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

export function formatBytes(
  bytes: number,
  decimals = 0,
  sizeType: "accurate" | "normal" = "normal",
) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate"
      ? (accurateSizes[i] ?? "Bytest")
      : (sizes[i] ?? "Bytes")
  }`;
}

export function formatToRupiah(number: number) {
  return new Intl.NumberFormat("id-ID").format(number);
}
export function abbreviationName(name: string): string {
  return name
    .split(" ")
    .map((kata) => kata[0]?.toUpperCase())
    .join("");
}

export function formatId(id: string) {
  return `#${id.toString().padStart(4, "0")}`;
}

// Fungsi untuk memvalidasi format slug
export const isValidSlug = (slug: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug); // Regex untuk validasi slug

// Fungsi slugify
export function slugify(str: string): string {
  str = str.trim();
  str = str.toLowerCase();
  str = str
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return str;
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

export function toSentenceCase(str: string) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function isMacOs() {
  if (typeof window === "undefined") return false;

  return window.navigator.userAgent.includes("Mac");
}

export function extractFileKeyFromUrl(url: string) {
  try {
    const parts = url.split("/");
    return parts.at(-1) ?? "";
  } catch {
    return "";
  }
}

// Fungsi helper untuk ekstrak `src` dari iframe
export function extractMapUrlFromIframe(iframeHtml: string): string | null {
  // Gunakan regex yang mengabaikan whitespace dan newline
  const match = iframeHtml.match(/<iframe[^>]+src\s*=\s*"(.*?)"/i);
  return match ? match[1] : null;
}

// Definisikan tipe input dan output untuk fungsi ini
interface CalculateItemPriceDetailsInput {
  price: number;
  quantity: number;
  priceOrder?: number | null;
}

interface CalculateItemPriceDetailsOutput {
  itemSubtotal: number;
  itemFinalPrice: number;
  itemAdjustmentAmount: number;
  itemAdjustmentText: string | null;
}

export function calculateItemPriceDetails(
  item: CalculateItemPriceDetailsInput,
): CalculateItemPriceDetailsOutput {
  // itemSubtotal selalu berdasarkan harga dasar (item.price dari DB Paket) * kuantitas
  const itemSubtotal = Number(item.price) * Number(item.quantity);

  // itemFinalPrice:
  // Jika priceOrder ada (tidak undefined dan tidak null), gunakan priceOrder sebagai harga TOTAL baris item.
  // Jika priceOrder tidak ada, gunakan itemSubtotal.
  const itemFinalPrice =
    item.priceOrder !== undefined && item.priceOrder !== null
      ? Number(item.priceOrder)
      : itemSubtotal;

  let itemAdjustmentAmount = 0;
  let itemAdjustmentText: string | null = null;

  // Hanya hitung penyesuaian jika itemFinalPrice berbeda dari itemSubtotal
  if (item.priceOrder !== 0) {
    if (itemFinalPrice > itemSubtotal) {
      itemAdjustmentAmount = itemFinalPrice - itemSubtotal;
      itemAdjustmentText = `Biaya Tambahan: Rp. ${formatToRupiah(itemAdjustmentAmount)}`;
    } else if (itemFinalPrice < itemSubtotal) {
      itemAdjustmentAmount = itemSubtotal - itemFinalPrice;
      itemAdjustmentText = `Diskon Biaya: Rp. ${formatToRupiah(itemAdjustmentAmount)}`;
    }
  }

  return {
    itemSubtotal,
    itemFinalPrice,
    itemAdjustmentAmount,
    itemAdjustmentText,
  };
}

// Item standar yang akan digunakan untuk perhitungan harga (output normalisasi)
export interface ItemPriceDetails {
  price: number; // Harga dasar per unit
  quantity: number; // Kuantitas item
  priceOrder?: number | null; // Harga total item yang disepakati (sudah termasuk quantity)
}

// Tipe output untuk fungsi perhitungan total keranjang/order
export interface CalculateOrderTotalsOutput {
  totalQuantity: number;
  subtotalPrice: number;
  finalPrice: number;
  adjustmentAmount: number;
  adjustmentText: string | null;
}

export function calculateOrderTotals(
  items: ItemPriceDetails[],
): CalculateOrderTotalsOutput {
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotalPrice = items.reduce((acc, item) => {
    // Subtotal selalu berdasarkan harga dasar (price dari Paket DB) * kuantitas
    return acc + Number(item.price) * Number(item.quantity);
  }, 0);

  const finalPrice = items.reduce((acc, item) => {
    // Harga final per item:
    // Jika priceOrder ada (tidak undefined dan tidak null), gunakan priceOrder sebagai harga TOTAL baris item.
    // Jika priceOrder tidak ada, gunakan harga dasar (item.price) * kuantitas.
    return (
      acc +
      (item.priceOrder !== undefined && item.priceOrder !== null
        ? Number(item.priceOrder) // Ini adalah harga TOTAL untuk item ini
        : Number(item.price) * Number(item.quantity))
    );
  }, 0);

  let adjustmentAmount = 0;
  let adjustmentText: string | null = null;

  if (finalPrice !== subtotalPrice) {
    if (finalPrice > subtotalPrice) {
      adjustmentAmount = finalPrice - subtotalPrice;
      adjustmentText = `Biaya Tambahan: Rp. ${formatToRupiah(adjustmentAmount)}`;
    } else if (finalPrice < subtotalPrice) {
      adjustmentAmount = subtotalPrice - finalPrice;
      adjustmentText = `Diskon Biaya: Rp. ${formatToRupiah(adjustmentAmount)}`;
    }
  }

  return {
    totalQuantity,
    subtotalPrice,
    finalPrice,
    adjustmentAmount,
    adjustmentText,
  };
}

// Helper untuk mendapatkan array dari enum
// Ini bisa ditempatkan di luar komponen atau di file utilitas
export const getEnumKeys = <T extends Record<string, string | number>>(
  enumObject: T,
): string[] => {
  return Object.keys(enumObject).filter((key) => isNaN(Number(key)));
};
