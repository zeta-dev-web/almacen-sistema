import { NextRequest, NextResponse } from "next/server";
import { supplierService } from "@/server/services/supplier.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    void (await params);
    const supplier = await supplierService.findAll({ isActive: undefined });
    return NextResponse.json(supplier);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request: _request,
      fallbackMessage: "Error al obtener proveedor",
    });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supplier = await supplierService.update(id, body);
    return NextResponse.json(supplier);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al actualizar proveedor",
    });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await supplierService.delete(id);
    return NextResponse.json(supplier);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request: _request,
      fallbackMessage: "Error al eliminar proveedor",
    });
  }
}
