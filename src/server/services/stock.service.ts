import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";
import { getCurrentEmployee } from "@/lib/auth";

interface StockAdjustmentDto {
  productId: string;
  type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  quantity: number;
  reason: string;
}

export const stockService = {
  async adjust(dto: StockAdjustmentDto) {
    const employee = await getCurrentEmployee();
    if (!employee) {
      throw new ApiError({
        status: httpStatus.UNAUTHORIZED,
        message: "No autorizado",
      });
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: "El motivo del ajuste es obligatorio",
      });
    }

    if (dto.quantity <= 0) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: "La cantidad debe ser mayor a 0",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
      include: { stock: true },
    });

    if (!product) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Producto no encontrado",
      });
    }

    if (!product.stock) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "El producto no tiene registro de stock",
      });
    }

    if (dto.type === "ADJUSTMENT_OUT" && product.stock.quantity < dto.quantity) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: `Stock insuficiente. Disponible: ${product.stock.quantity}`,
      });
    }

    return prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type as MovementType,
          quantity: dto.quantity,
          description: dto.reason,
          createdById: employee.id,
        },
      });

      const delta = dto.type === "ADJUSTMENT_IN" ? dto.quantity : -dto.quantity;

      if (dto.type === "ADJUSTMENT_OUT") {
        const updated = await tx.stock.updateMany({
          where: { productId: dto.productId, quantity: { gte: dto.quantity } },
          data: { quantity: { decrement: dto.quantity } },
        });
        if (updated.count === 0) {
          throw new ApiError({
            status: httpStatus.CONFLICT,
            message: "Stock insuficiente en el momento del ajuste",
          });
        }
      } else {
        await tx.stock.update({
          where: { productId: dto.productId },
          data: { quantity: { increment: dto.quantity } },
        });
      }

      const updatedStock = await tx.stock.findUnique({
        where: { productId: dto.productId },
      });

      // Si es entrada y el stock ahora supera el mínimo, descartar alertas activas
      if (dto.type === "ADJUSTMENT_IN" && updatedStock && updatedStock.quantity >= updatedStock.minStock) {
        await tx.stockAlert.updateMany({
          where: {
            productId: dto.productId,
            dismissedAt: null,
          },
          data: {
            dismissedAt: new Date(),
          },
        });
      }

      return { movement, stock: updatedStock, delta };
    });
  },

  async getMovements(params: {
    productId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { productId, type, page = 1, limit = 50 } = params;

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, barcode: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { items, total, page, limit };
  },
};