import { NextRequest, NextResponse } from "next/server";
import { reportService } from "@/server/services/report.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "dashboard";

    if (type === "sales") {
      const from = searchParams.get("from") || undefined;
      const to = searchParams.get("to") || undefined;
      const employeeId = searchParams.get("employeeId") || undefined;
      const paymentMethodId = searchParams.get("paymentMethodId") || undefined;
      const categoryId = searchParams.get("categoryId") || undefined;
      const result = await reportService.getSalesSummary({ from, to, employeeId, paymentMethodId, categoryId });
      return NextResponse.json(result);
    }

    if (type === "stock-alerts") {
      const result = await reportService.getStockAlerts();
      return NextResponse.json(result);
    }

    const result = await reportService.getDashboardStats();
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener reportes",
    });
  }
}
