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
    }

    class MidtransError extends Error {
      httpStatusCode: number;
      ApiResponse: unknown;
    }
  }

  export = midtransClient;
}
