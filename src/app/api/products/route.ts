import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/server/services/product.service";
import { ApiError } from "@/utils/handlers/apiError.handler";
import apiErrorHandler from "@/utils/handlers/apiError.handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const isActive = searchParams.get("isActive")
      ? searchParams.get("isActive") === "true"
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const activeOnly = searchParams.get("activeOnly") === "true";

    if (activeOnly) {
      const products = await productService.findAllActive();
      return NextResponse.json(
        products.map((p) => ({
          ...p,
          price: Number(p.price),
          costPrice: Number(p.costPrice),
          stock: p.stock
            ? { ...p.stock, quantity: p.stock.quantity }
            : null,
        })),
      );
    }

    const result = await productService.findAll({
      search,
      categoryId,
      isActive,
      page,
      limit,
    });

    return NextResponse.json({
      ...result,
      items: result.items.map((p) => ({
        ...p,
        price: Number(p.price),
        costPrice: Number(p.costPrice),
        stock: p.stock
          ? { ...p.stock, quantity: p.stock.quantity }
          : null,
      })),
    });
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al obtener productos",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await productService.create(body);
    return NextResponse.json(
      {
        ...product,
        price: Number(product.price),
        costPrice: Number(product.costPrice),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorHandler({
      error: error instanceof ApiError ? error : new ApiError({ message: String(error) }),
      request,
      fallbackMessage: "Error al crear producto",
    });
  }
}