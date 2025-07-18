import { StatusTransactionResponse } from "midtrans-client";

describe("POST /api/midtrans/notification", () => {
  it("should respond with success when signature is valid", async () => {
    const validPayload = {
      order_id: "472a553b-297d-4068-828d-8bb131d80616",
      status_code: "201",
      gross_amount: "90000.00",
      transaction_status: "pending",
      fraud_status: "accept",
      payment_type: "bank_transfer",
      transaction_id: "0da3e5ec-69be-4493-bceb-c823f5c8f8c0",
      transaction_time: "2025-07-16 21:52:58",
      signature_key:
        "241cf257768b3eb99920822cbae8ee00ef3b940d54f246055f361c89a8651c704ffa60c8f9d1b56edb9b7eb21987fe4cc0f66183d4f9fc878e31f9fb91f9fd4f",
    };

    const req = await fetch(
      `https://wasshoes.vercel.app/api/transactions/notif`,
      {
        body: JSON.stringify(validPayload),
        method: "POST",
      },
    );

    const res = (await req.json()) as {
      status: string;
      message: string;
      data: StatusTransactionResponse;
    };

    expect(req.status).toBe(200);
    expect(res).toMatchObject({
      status: "success",
      message: "transaction status updated",
    });
  });

  it("should respond 403 when signature is invalid", async () => {
    const invalidPayload = {
      order_id: "order-123",
      status_code: "200",
      gross_amount: "100000",
      fraud_status: "accept",
      signature_key: "INVALID_SIGNATURE",
    };

    const req = await fetch(
      `https://wasshoes.vercel.app/api/transactions/notif`,
      {
        body: JSON.stringify(invalidPayload),
        method: "POST",
      },
    );

    const res = (await req.json()) as {
      message: string;
    };

    expect(req.status).toBe(403);
    expect(res).toMatchObject({
      message: "Invalid signature",
    });
  });

  it("should respond 404 when order not found", async () => {
    const invalidPayload = {
      order_id: "8a0dd7dc-e155-42eb-a4d5-a9026e65f0ad",
      status_code: "201",
      gross_amount: "150000.00",
      transaction_status: "pending",
      fraud_status: "accept",
      payment_type: "bank_transfer",
      transaction_id: "9d050d89-f351-464e-b13f-b0efdbf48604",
      transaction_time: "2025-05-29 12:11:59",
      signature_key:
        "cc40754c429f67fc2993a4e799214032d51a112b40cb1c97f81b1b7acd720967ad45fbe3cb975188bfdf77ca28777edf943e001dd8c64b42228b078bfd45cf2e",
    };

    const req = await fetch(
      `https://wasshoes.vercel.app/api/transactions/notif`,
      {
        body: JSON.stringify(invalidPayload),
        method: "POST",
      },
    );

    const res = (await req.json()) as {
      error: string;
    };

    expect(req.status).toBe(404);
    expect(res).toMatchObject({
      error: "Order tidak ditemukan",
    });
  });
});
