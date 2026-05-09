import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        barcode: true,
        price: true,
        stock: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 2000, // Límite de seguridad
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      price: Number(p.price),
      stock: p.stock?.quantity || 0,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching POS products:", error);
    return NextResponse.json(
      { error: "Error al cargar productos" },
      { status: 500 }
    );
  }
}
