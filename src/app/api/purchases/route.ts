import { NextRequest, NextResponse } from "next/server";
import { purchaseService } from "@/server/services/supplier.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const supplierId = searchParams.get("supplierId") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const result = await purchaseService.findAll({ page, limit, supplierId, dateFrom, dateTo });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener compras",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const purchase = await purchaseService.create(body);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al registrar compra",
    });
  }
}
