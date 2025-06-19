"use server";

import { db } from "@/lib/db";
import { getErrorMessage } from "@/lib/handle-error";
import { coreApi } from "@/lib/midtrans";
import { TStatusOrder } from "@prisma/client";
import {
  MidtransApiErrorResponse,
  MidtransError,
  StatusTransactionResponse,
} from "midtrans-client";

export interface GetMidtransStatusResult {
  data: StatusTransactionResponse | null;
  error: string | null;
  message: string | null;
}

// Interface untuk Order (minimal yang dibutuhkan oleh fungsi ini)
export interface OrderMinimal {
  id: string;
  status: TStatusOrder;
}

/**
 * @function getMidtransStatus
 * @description Mengambil status transaksi dari Midtrans berdasarkan order ID.
 * Menangani respon sukses dan error dari Midtrans API.
 * @param {string} order_id - ID pesanan untuk dicek statusnya di Midtrans.
 * @returns {Promise<GetMidtransStatusResult>} Objek hasil yang berisi data, error, dan pesan.
 */
export const getMidtransStatus = async (
  order_id: string,
): Promise<GetMidtransStatusResult> => {
  try {
    const midtransStatus: StatusTransactionResponse =
      await coreApi.transaction.status(order_id);

    return {
      data: midtransStatus,
      error: null,
      message:
        midtransStatus.status_message ||
        "Transaction status retrieved successfully.",
    };
  } catch (error) {
    if (error instanceof MidtransError) {
      const apiResponse: MidtransApiErrorResponse | undefined =
        error.ApiResponse as MidtransApiErrorResponse | undefined;

      const errorMessage =
        apiResponse?.status_message || error.message || getErrorMessage(error);

      return {
        data: null,
        error: null, // Pastikan error adalah null jika apiResponse tidak ada
        message: errorMessage,
      };
    } else {
      // Jika error bukan MidtransError (misalnya error jaringan)
      return {
        data: null,
        error: null, // Tidak ada MidtransApiErrorResponse di sini
        message: getErrorMessage(error) || "An unexpected error occurred.",
      };
    }
  }
};
/**
 * @function mapMidtransStatusToTStatusOrder
 * @description Memetakan status transaksi dari Midtrans API ke enum TStatusOrder lokal.
 * @param midtransStatus Respon status dari Midtrans API.
 * @returns Status TStatusOrder yang dipetakan, atau undefined jika tidak ada pemetaan.
 */
function mapMidtransStatusToTStatusOrder(
  midtransStatus: StatusTransactionResponse,
): TStatusOrder | undefined {
  const statusFromMidtransApi = midtransStatus.transaction_status.toLowerCase();

  if (statusFromMidtransApi === "capture") {
    if (midtransStatus.fraud_status === "accept") {
      return TStatusOrder.SETTLEMENT;
    }
  } else if (statusFromMidtransApi === "settlement") {
    return TStatusOrder.SETTLEMENT;
  } else if (
    statusFromMidtransApi === "cancel" ||
    statusFromMidtransApi === "deny" ||
    statusFromMidtransApi === "expire"
  ) {
    return TStatusOrder.FAILURE;
  } else if (statusFromMidtransApi === "pending") {
    return TStatusOrder.PENDING;
  } else if (
    statusFromMidtransApi === "refund" ||
    statusFromMidtransApi === "partial_refund"
  ) {
    return TStatusOrder.REFUND;
  }
  return undefined; // Jika tidak ada status yang cocok
}

// Output dari fungsi status handler processMidtransOrderStatus
export interface ProcessMidtransStatusOutput {
  updatedOrderStatus: TStatusOrder;
  midtransApiErrorMessage: string | undefined | object | null; // Bisa string, object, atau null
  midtransStatusData: StatusTransactionResponse | null;
}

/**
 * @function processMidtransOrderStatus
 * @description Menangani pembaruan status order berdasarkan respon dari Midtrans API.
 * Jika status dari Midtrans berbeda dengan status di DB, maka DB akan diupdate.
 * @param {object} params - Objek parameter.
 * @param {OrderMinimal} params.order - Objek order minimal yang berisi id dan status saat ini dari DB.
 * @param {GetMidtransStatusResult} params.midtransStatusResult - Hasil dari pemanggilan getMidtansStatus.
 * @returns {Promise<ProcessMidtransStatusOutput>} Objek yang berisi updatedOrderStatus, midtransApiErrorMessage, dan midtransStatusData.
 */
export async function processMidtransOrderStatus({
  order,
  midtransStatusResult,
}: {
  order: OrderMinimal;
  midtransStatusResult: GetMidtransStatusResult;
}): Promise<ProcessMidtransStatusOutput> {
  let currentOrderStatusInDb: TStatusOrder = order.status;
  let midtransApiErrorMessage: string | undefined | object = undefined;

  const {
    data: midtransStatusData,
    error: midtransApiError,
    message: midtransErrorMessage,
  } = midtransStatusResult;

  if (midtransStatusData) {
    const mappedStatus = mapMidtransStatusToTStatusOrder(midtransStatusData);

    if (mappedStatus && currentOrderStatusInDb !== mappedStatus) {
      console.log(
        `Updating order ${order.id} status from ${currentOrderStatusInDb} to ${mappedStatus} (from Midtrans API)`,
      );
      await db.order.update({
        where: { id: order.id },
        data: {
          status: mappedStatus,
        },
      });
      currentOrderStatusInDb = mappedStatus;
    }
  } else {
    midtransApiErrorMessage =
      midtransApiError ||
      midtransErrorMessage ||
      "Failed to get status from Midtrans API.";
    console.log("Error fetching Midtrans status:", midtransApiErrorMessage);
  }

  return {
    updatedOrderStatus: currentOrderStatusInDb,
    midtransApiErrorMessage,
    midtransStatusData,
  };
}
