import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";
import { getCurrentEmployee } from "@/lib/auth";
import { supplierRepository } from "@/server/repository/supplier.repository";
import { Prisma } from "@prisma/client";

interface PurchaseItemDto {
  productId: string;
  quantity: number;
  costPrice: number;
}

interface CreatePurchaseDto {
  supplierId: string;
  items: PurchaseItemDto[];
}

export const supplierService = {
  async create(data: { name: string; contactName?: string; phone?: string; email?: string }) {
    return supplierRepository.create(data);
  },

  async update(id: string, data: { name?: string; contactName?: string; phone?: string; email?: string; isActive?: boolean }) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Proveedor no encontrado" });
    }
    return supplierRepository.update(id, data);
  },

  async delete(id: string) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Proveedor no encontrado" });
    }
    if (supplier.purchases?.length > 0) {
      return supplierRepository.update(id, { isActive: false });
    }
    return supplierRepository.delete(id);
  },

  async findAll(params: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const result = await supplierRepository.findAll(params);
    return result;
  },

  async findAllActive() {
    return supplierRepository.findAllActive();
  },
};

export const purchaseService = {
  async create(dto: CreatePurchaseDto) {
    const employee = await getCurrentEmployee();
    if (!employee) {
      throw new ApiError({ status: httpStatus.UNAUTHORIZED, message: "No autorizado" });
    }

    if (!dto.items || dto.items.length === 0) {
      throw new ApiError({ status: httpStatus.BAD_REQUEST, message: "La compra debe tener al menos un producto" });
    }

    const supplier = await supplierRepository.findById(dto.supplierId);
    if (!supplier) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Proveedor no encontrado" });
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { stock: true },
    });

    if (products.length !== productIds.length) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Uno o más productos no encontrados" });
    }

    let total = new Prisma.Decimal(0);
    const purchaseItemsData: { productId: string; quantity: number; costPrice: Prisma.Decimal }[] = [];

    for (const item of dto.items) {
      const costPrice = new Prisma.Decimal(item.costPrice);
      const itemTotal = costPrice.mul(item.quantity);
      total = total.add(itemTotal);
      purchaseItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        costPrice,
      });
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId: dto.supplierId,
          total,
        },
      });

      await tx.purchaseItem.createMany({
        data: purchaseItemsData.map((pi) => ({
          ...pi,
          purchaseId: newPurchase.id,
        })),
      });

      for (const item of dto.items) {
        const existingStock = await tx.stock.findUnique({
          where: { productId: item.productId },
        });

        if (existingStock) {
          await tx.stock.update({
            where: { productId: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.stock.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.PURCHASE,
            quantity: item.quantity,
            referenceId: newPurchase.id,
            description: `Compra a ${supplier.name}`,
            createdById: employee.id,
          },
        });
      }

      // Registrar egreso en caja si hay una abierta
      const openDrawer = await tx.cashDrawer.findFirst({
        where: { employeeId: employee.id, status: "OPEN" },
      });
      if (openDrawer) {
        await tx.transaction.create({
          data: {
            cashDrawerId: openDrawer.id,
            type: "EXPENSE",
            amount: total,
            description: `Compra a ${supplier.name}`,
            createdById: employee.id,
          },
        });
      }

      return tx.purchase.findUnique({
        where: { id: newPurchase.id },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      });
    });

    return {
      ...purchase,
      total: Number(purchase?.total),
      items: purchase?.items.map((pi) => ({
        ...pi,
        costPrice: Number(pi.costPrice),
      })),
    };
  },

  async findAll(params: { page?: number; limit?: number; supplierId?: string; dateFrom?: string; dateTo?: string }) {
    const { page = 1, limit = 50, supplierId, dateFrom, dateTo } = params;
    const where: Prisma.PurchaseWhereInput = {};
    if (supplierId) where.supplierId = supplierId;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(`${dateFrom}T00:00:00-03:00`) }),
        ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999-03:00`) }),
      };
    }

    const [items, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        ...p,
        total: Number(p.total),
        items: p.items.map((pi) => ({
          ...pi,
          costPrice: Number(pi.costPrice),
        })),
      })),
      total,
      page,
      limit,
    };
  },
};
