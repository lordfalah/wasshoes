// types/midtrans-client.d.ts

declare module "midtrans-client" {
  namespace midtransClient {
    interface SnapTransactionParams {
      transaction_details: {
        order_id: string;
        gross_amount: number;
      };
      item_details?: {
        id?: string;
        name: string;
        price: number;
        quantity: number;
        brand?: string;
        category?: string;
        merchant_name?: string;
      }[];
      customer_details?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        billing_address?: Address;
        shipping_address?: Address;
      };
      enabled_payments?: string[];
      credit_card?: {
        secure?: boolean;
      };
      callbacks?: {
        finish?: string;
      };
      custom_field1?: string;
      custom_field2?: string;
      custom_field3?: string;
    }

    interface Address {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country_code?: string;
    }

    interface StatusTransactionResponse {
      status_code: string;
      status_message: string;
      transaction_id: string;
      masked_card: string;
      order_id: string;
      payment_type: string;
      transaction_time: string;
      transaction_status: string;
      fraud_status: string;
      approval_code: string;
      signature_key: string;
      bank: string;
      gross_amount: string;
      channel_response_code: string;
      channel_response_message: string;
      card_type: string;
      payment_option_type: string;
      shopeepay_reference_number: string;
      reference_id: string;
    }

    // Definisi untuk respons cancel yang sudah diperbarui berdasarkan contoh
    interface CancelTransactionResponse {
      status_code: string;
      status_message: string;
      transaction_id: string;
      masked_card?: string; // Opsional karena mungkin tidak selalu ada (misal non-kartu kredit)
      order_id: string;
      payment_type: string;
      transaction_time: string;
      transaction_status: string; // Akan "cancel" jika sukses
      fraud_status: string;
      bank?: string; // Opsional, mungkin tidak selalu ada (misal non-bank transfer)
      gross_amount: string;
    }

    class Snap {
      constructor(config: {
        isProduction: boolean;
        serverKey: string;
        clientKey: string;
      });
      createTransaction(params: SnapTransactionParams): Promise<{
        token: string;
        redirect_url: string;
      }>;
    }

    class CoreApi {
      constructor(config: {
        isProduction: boolean;
        serverKey: string;
        clientKey: string;
      });

      // Ini adalah cara yang benar untuk memanggil status
      // midtrans-client CoreApi memiliki properti 'transaction' yang berisi metode 'status'
      transaction: {
        status(orderId: string): Promise<StatusTransactionResponse>;
        /**
         * Cancels a Midtrans transaction by its order ID.
         * @param orderId The order ID of the transaction to cancel.
         * @returns A Promise that resolves with the cancellation response from Midtrans.
         */
        cancel(orderId: string): Promise<CancelTransactionResponse>;
        // Tambahkan metode lain jika Anda menggunakannya dari CoreApi
        // approve(orderId: string): Promise<any>;
        // deny(orderId: string): Promise<any>;
        // refund(orderId: string, params?: { gross_amount?: number; reason?: string }): Promise<any>;
        // expire(orderId: string): Promise<any>;
      };
    }

    class MidtransError extends Error {
      httpStatusCode: number;
      ApiResponse: unknown;
    }
  }

  export = midtransClient;
}
