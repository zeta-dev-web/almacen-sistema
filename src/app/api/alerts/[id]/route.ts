import { NextRequest, NextResponse } from "next/server";
import { stockAlertService } from "@/server/services/stockAlert.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await stockAlertService.dismissAlert(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al descartar alerta",
    });
  }
}
