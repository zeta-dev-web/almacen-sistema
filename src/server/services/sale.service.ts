import { prisma } from "@/lib/prisma";
import { MovementType, SaleStatus } from "@prisma/client";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";
import { getCurrentEmployee } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { stockAlertService } from "@/server/services/stockAlert.service";

interface SaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface SalePaymentDto {
  paymentMethodId: string;
  amount: number;
}

interface CreateSaleDto {
  items: SaleItemDto[];
  payments: SalePaymentDto[];
  cashDrawerId?: string;
  discount?: number;
  discountType?: "percentage" | "fixed";
}

export const saleService = {
  async create(dto: CreateSaleDto, authHeader?: string) {
    const employee = await getCurrentEmployee(authHeader);
    if (!employee) {
      throw new ApiError({
        status: httpStatus.UNAUTHORIZED,
        message: "No autorizado",
      });
    }

    // Asociar automáticamente a la caja abierta del empleado
    const openDrawer = await prisma.cashDrawer.findFirst({
      where: { employeeId: employee.id, status: "OPEN" },
    });
    if (openDrawer) {
      dto.cashDrawerId = openDrawer.id;
    }

    if (!dto.items || dto.items.length === 0) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: "La venta debe tener al menos un producto",
      });
    }

    if (!dto.payments || dto.payments.length === 0) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: "La venta debe tener al menos un pago",
      });
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { stock: true },
    });

    if (products.length !== productIds.length) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Uno o más productos no encontrados",
      });
    }

    for (const item of dto.items) {
      const p = products.find((pr) => pr.id === item.productId);
      if (!p?.stock || p.stock.quantity < item.quantity) {
        throw new ApiError({
          status: httpStatus.BAD_REQUEST,
          message: `Stock insuficiente para ${p?.name || item.productId}. Disponible: ${p?.stock?.quantity || 0}`,
        });
      }
    }

    let subtotal = new Prisma.Decimal(0);
    const saleItemsData: Prisma.SaleItemCreateManySaleInput[] = [];

  for (const item of dto.items) {
    const unitPrice = new Prisma.Decimal(item.unitPrice);
      const itemSubtotal = unitPrice.mul(item.quantity);
      subtotal = subtotal.add(itemSubtotal);

      saleItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    let discountAmount = new Prisma.Decimal(0);
    if (dto.discount && dto.discount > 0) {
      if (dto.discountType === "percentage") {
        discountAmount = subtotal.mul(dto.discount).div(100);
      } else {
        discountAmount = new Prisma.Decimal(dto.discount);
      }
    }

    const total = subtotal.sub(discountAmount);

    const paymentsTotal = dto.payments.reduce(
      (sum, p) => sum.add(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0),
    );

    if (paymentsTotal.lt(total)) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: `Los montos no coinciden. Total: $${total}, Pagado: $${paymentsTotal}`,
      });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          employeeId: employee.id,
          cashDrawerId: dto.cashDrawerId,
          total,
          status: SaleStatus.COMPLETED,
        },
      });

      await tx.saleItem.createMany({
        data: saleItemsData.map((si) => ({
          ...si,
          saleId: newSale.id,
        })),
      });

      await tx.salePayment.createMany({
        data: dto.payments.map((p) => ({
          saleId: newSale.id,
          paymentMethodId: p.paymentMethodId,
          amount: new Prisma.Decimal(p.amount),
        })),
      });

      for (const item of dto.items) {
        const updated = await tx.stock.updateMany({
          where: {
            productId: item.productId,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new ApiError({
            status: httpStatus.CONFLICT,
            message: `Stock insuficiente para el producto ${item.productId}`,
          });
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.SALE,
            quantity: item.quantity,
            referenceId: newSale.id,
            description: `Venta #${newSale.receiptNumber}`,
            createdById: employee.id,
          },
        });

        // Verificar si el stock cayó por debajo del mínimo y crear alerta
        const stockAfterSale = await tx.stock.findUnique({
          where: { productId: item.productId },
        });

        if (stockAfterSale && stockAfterSale.quantity < stockAfterSale.minStock) {
          await tx.stockAlert.create({
            data: {
              productId: item.productId,
              quantity: stockAfterSale.quantity,
              minStock: stockAfterSale.minStock,
            },
          });
        }
      }

      return tx.sale.findUnique({
        where: { id: newSale.id },
        include: {
          saleItems: { 
            include: { 
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          salePayments: { 
            include: { 
              paymentMethod: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          employee: { select: { name: true } },
        },
      });
    });

    return sale;
  },

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
    receiptNumber?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page = 1, limit = 50, status, employeeId, receiptNumber, dateFrom, dateTo } = params;
    const where: Prisma.SaleWhereInput = {};
    if (status) where.status = status as SaleStatus;
    if (employeeId) where.employeeId = employeeId;
    if (receiptNumber) where.receiptNumber = receiptNumber;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(`${dateFrom}T00:00:00-03:00`) }),
        ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999-03:00`) }),
        ...(!dateTo && dateFrom && { lte: new Date(`${dateFrom}T23:59:59.999-03:00`) }),
      };
    }

    const [items, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: {
          id: true,
          receiptNumber: true,
          total: true,
          status: true,
          createdAt: true,
          employee: { 
            select: { 
              id: true, 
              name: true,
            },
          },
          saleItems: { 
            select: {
              quantity: true,
              unitPrice: true,
              subtotal: true,
              product: { 
                select: { 
                  id: true,
                  name: true,
                },
              },
            },
          },
          salePayments: { 
            select: {
              amount: true,
              paymentMethod: { 
                select: { 
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        ...s,
        total: Number(s.total),
        saleItems: s.saleItems.map((si) => ({
          ...si,
          unitPrice: Number(si.unitPrice),
          subtotal: Number(si.subtotal),
        })),
        salePayments: s.salePayments.map((sp) => ({
          ...sp,
          amount: Number(sp.amount),
        })),
      })),
      total,
      page,
      limit,
    };
  },
};