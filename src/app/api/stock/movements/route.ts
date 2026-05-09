import { NextRequest, NextResponse } from "next/server";
import { stockService } from "@/server/services/stock.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId") || undefined;
    const type = searchParams.get("type") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await stockService.getMovements({
      productId,
      type,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener movimientos",
    });
  }
}