import { NextRequest, NextResponse } from "next/server";
import { cashDrawerService } from "@/server/services/cashDrawer.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const result = await cashDrawerService.findAll({ status, employeeId, dateFrom, dateTo, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener cajas",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const drawer = await cashDrawerService.open(body.openAmount);
    return NextResponse.json(drawer, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al abrir caja",
    });
  }
}
