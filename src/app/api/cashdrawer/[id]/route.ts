import { NextRequest, NextResponse } from "next/server";
import { cashDrawerService } from "@/server/services/cashDrawer.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const drawer = await cashDrawerService.findById(id);
    if (!drawer) {
      throw new ApiError({ status: 404, message: "Caja no encontrada" });
    }
    return NextResponse.json(drawer);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request: _request,
      fallbackMessage: "Error al obtener caja",
    });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "close") {
      const drawer = await cashDrawerService.close(id, body.closeAmount, body.closeNote);
      return NextResponse.json(drawer);
    }

    throw new ApiError({ status: 400, message: "Acción no válida" });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al actualizar caja",
    });
  }
}
