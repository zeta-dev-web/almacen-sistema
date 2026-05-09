import { NextRequest, NextResponse } from "next/server";
import { supplierService } from "@/server/services/supplier.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive") === "true" ? true : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const result = await supplierService.findAll({ search, isActive, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener proveedores",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await supplierService.create(body);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al crear proveedor",
    });
  }
}
