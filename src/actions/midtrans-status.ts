"use server";

import { getErrorMessage } from "@/lib/handle-error";
import { coreApi } from "@/lib/midtrans";
import { MidtransError } from "midtrans-client";

export const getMidtansStatus = async (order_id: string) => {
  try {
    const midtransStatus = await coreApi.transaction.status(order_id);

    return {
      data: midtransStatus,
      error: null, // Jika sukses, error harus null
      message: midtransStatus.status_message, // Pesan sukses
    };
  } catch (error) {
    if (error instanceof MidtransError) {
      // Jika error adalah MidtransError
      const apiResponse = error.ApiResponse; // Ini adalah objek error dari Midtrans API

      // Contoh bagaimana mengakses detail dari apiResponse
      // Jika Anda memiliki tipe MidtransApiErrorResponse, Anda bisa menggunakannya di sini
      const errorMessage =
        apiResponse &&
        typeof apiResponse === "object" &&
        "status_message" in apiResponse
          ? apiResponse.status_message // Cast ke any sementara atau gunakan type guard
          : error.message;

      return {
        data: null,
        error: apiResponse, // Mengembalikan objek ApiResponse dari Midtrans
        message: errorMessage || getErrorMessage(error), // Gunakan status_message jika ada, fallback ke error.message atau getErrorMessage
      };
    }

    // Jika error bukan MidtransError (misalnya error jaringan, dll.)
    return {
      data: null,
      error: null, // Jika bukan MidtransError, error ApiResponse mungkin tidak relevan di sini
      message: getErrorMessage(error), // Menggunakan fungsi getErrorMessage untuk error non-Midtrans
    };
  }
};
