import { NextRequest, NextResponse } from "next/server";
import { employeeService } from "@/server/services/user.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const employees = await employeeService.findAll(search);
    return NextResponse.json(employees.map((e) => ({
      ...e,
      pinHash: undefined,
    })));
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener empleados",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employee = await employeeService.create(body);
    return NextResponse.json({ ...employee, pinHash: undefined }, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al crear empleado",
    });
  }
}
