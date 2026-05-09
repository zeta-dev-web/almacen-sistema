import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/server/services/product.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await productService.findById(id);
    return NextResponse.json({
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
    });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener producto",
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const product = await productService.update(id, body);
    return NextResponse.json({
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
    });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al actualizar producto",
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await productService.delete(id);
    return NextResponse.json({
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
    });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al eliminar producto",
    });
  }
}