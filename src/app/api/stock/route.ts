import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/server/services/stock.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await stockService.adjust(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al ajustar stock",
    });
  }
}