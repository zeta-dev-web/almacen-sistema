import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "@/server/services/category.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const categories = await categoryService.findAll(search);
    return NextResponse.json(categories);
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener categorías",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await categoryService.create(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al crear categoría",
    });
  }
}