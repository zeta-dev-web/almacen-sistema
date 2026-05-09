import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        costPrice: true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      costPrice: Number(p.costPrice),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    );
  }
}
