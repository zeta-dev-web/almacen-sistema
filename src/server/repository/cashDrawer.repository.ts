import { prisma } from "@/lib/prisma";
import { Prisma, CashDrawerStatus } from "@prisma/client";

interface FindAllParams {
  status?: CashDrawerStatus;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const cashDrawerRepository = {
  async create(data: Prisma.CashDrawerCreateInput) {
    return prisma.cashDrawer.create({
      data,
      include: {
        employee: { select: { name: true } },
        transactions: { include: { paymentMethod: true, createdBy: { select: { name: true } } } },
        sales: { include: { salePayments: { include: { paymentMethod: true } } } },
      },
    });
  },

  async findById(id: string) {
    return prisma.cashDrawer.findUnique({
      where: { id },
      include: {
        employee: { select: { name: true } },
        transactions: {
          include: { paymentMethod: true, createdBy: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
        sales: {
          include: { salePayments: { include: { paymentMethod: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async findOpenByEmployee(employeeId: string) {
    return prisma.cashDrawer.findFirst({
      where: { employeeId, status: CashDrawerStatus.OPEN },
    });
  },

  async update(id: string, data: Prisma.CashDrawerUpdateInput) {
    return prisma.cashDrawer.update({
      where: { id },
      data,
      include: {
        employee: { select: { name: true } },
        transactions: true,
      },
    });
  },

  async findAll({ status, employeeId, dateFrom, dateTo, page = 1, limit = 50 }: FindAllParams) {
    const where: Prisma.CashDrawerWhereInput = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (dateFrom || dateTo) {
      where.openDate = {
        ...(dateFrom && { gte: new Date(`${dateFrom}T00:00:00-03:00`) }),
        ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999-03:00`) }),
      };
    }

    const [items, total] = await Promise.all([
      prisma.cashDrawer.findMany({
        where,
        include: {
          employee: { select: { name: true } },
          _count: { select: { transactions: true, sales: true } },
        },
        orderBy: { openDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cashDrawer.count({ where }),
    ]);

    return { items, total, page, limit };
  },
};
