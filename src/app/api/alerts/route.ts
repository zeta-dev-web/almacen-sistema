import { NextRequest, NextResponse } from "next/server";
import { stockAlertService } from "@/server/services/stockAlert.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const alerts = await stockAlertService.getActiveAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener alertas",
    });
  }
}
