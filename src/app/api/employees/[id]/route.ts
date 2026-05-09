import { NextRequest, NextResponse } from "next/server";
import { employeeService } from "@/server/services/user.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const employee = await employeeService.update(id, body);
    return NextResponse.json({ ...employee, pinHash: undefined });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al actualizar empleado",
    });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const employee = await employeeService.delete(id);
    return NextResponse.json({ ...employee, pinHash: undefined });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request: _request,
      fallbackMessage: "Error al desactivar empleado",
    });
  }
}
