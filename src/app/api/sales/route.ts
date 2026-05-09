import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/server/services/sale.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const receiptNumber = searchParams.get("receiptNumber") ? parseInt(searchParams.get("receiptNumber")!) : undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const result = await saleService.findAll({ page, limit, status, employeeId, receiptNumber, dateFrom, dateTo });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener ventas",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization') || undefined;
    const sale = await saleService.create(body, authHeader);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al registrar venta",
    });
  }
}