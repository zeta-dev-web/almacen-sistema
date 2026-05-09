import { NextRequest, NextResponse } from "next/server";
import { cashDrawerService } from "@/server/services/cashDrawer.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const transaction = await cashDrawerService.addTransaction(
      id,
      body.type,
      body.amount,
      body.description,
      body.paymentMethodId,
    );
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al registrar transacción",
    });
  }
}
