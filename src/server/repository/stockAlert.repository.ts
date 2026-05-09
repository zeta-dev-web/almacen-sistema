import { prisma } from "@/lib/prisma";

export const stockAlertRepository = {
  async create(productId: string, quantity: number, minStock: number) {
    return prisma.stockAlert.create({
      data: {
        productId,
        quantity,
        minStock,
      },
    });
  },

  async findActive() {
    return prisma.stockAlert.findMany({
      where: {
        dismissedAt: null,
      },
      include: {
        product: {
          include: {
            stock: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async dismiss(id: string) {
    return prisma.stockAlert.update({
      where: { id },
      data: {
        dismissedAt: new Date(),
      },
    });
  },

  async countActive() {
    return prisma.stockAlert.count({
      where: {
        dismissedAt: null,
      },
    });
  },
};
