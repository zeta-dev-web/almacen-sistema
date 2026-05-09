import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(methods);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener métodos de pago",
    });
  }
}