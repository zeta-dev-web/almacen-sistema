import { prisma } from "@/lib/prisma";
import { SaleStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

export const reportService = {
  async getSalesSummary(params: { from?: string; to?: string; employeeId?: string; paymentMethodId?: string; categoryId?: string }) {
    const from = params.from ? new Date(`${params.from}T00:00:00-03:00`) : new Date(`${new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })}T00:00:00-03:00`);
    const to = params.to ? new Date(`${params.to}T23:59:59.999-03:00`) : new Date(`${params.from ?? new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })}T23:59:59.999-03:00`);

    const where: Prisma.SaleWhereInput = {
      createdAt: { gte: from, lte: to },
      status: SaleStatus.COMPLETED,
      ...(params.employeeId && { employeeId: params.employeeId }),
      ...(params.paymentMethodId && {
        salePayments: { some: { paymentMethodId: params.paymentMethodId } },
      }),
      ...(params.categoryId && {
        saleItems: { some: { product: { categoryId: params.categoryId } } },
      }),
    };

    const [sales, totalRevenueAgg, totalSales, avgTicket] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          saleItems: { include: { product: { select: { name: true, costPrice: true } } } },
          salePayments: { include: { paymentMethod: true } },
          employee: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.sale.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.sale.count({ where }),
      prisma.sale.aggregate({
        where,
        _avg: { total: true },
      }),
    ]);

    const productSales: Record<string, { name: string; quantity: number; revenue: number; cost: number }> = {};
    for (const sale of sales) {
      for (const item of sale.saleItems) {
        const name = item.product?.name || "—";
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name, quantity: 0, revenue: 0, cost: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += Number(item.subtotal);
        productSales[item.productId].cost += Number(item.product?.costPrice || 0) * item.quantity;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const paymentMethodTotals: Record<string, { name: string; amount: number; count: number }> = {};
    for (const sale of sales) {
      for (const payment of sale.salePayments) {
        const name = payment.paymentMethod?.name || "—";
        if (!paymentMethodTotals[payment.paymentMethodId]) {
          paymentMethodTotals[payment.paymentMethodId] = { name, amount: 0, count: 0 };
        }
        paymentMethodTotals[payment.paymentMethodId].amount += Number(payment.amount);
        paymentMethodTotals[payment.paymentMethodId].count += 1;
      }
    }

    const totalCost = Object.values(productSales).reduce((s, p) => s + p.cost, 0);
    const totalRevenue = Number(totalRevenueAgg._sum.total || 0);

    return {
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      totalSales,
      avgTicket: Number(avgTicket._avg.total || 0),
      topProducts,
      paymentMethods: Object.values(paymentMethodTotals),
      period: { from: from.toISOString(), to: to.toISOString() },
    };
  },

  async getStockAlerts() {
    const lowStock = await prisma.product.findMany({
      where: { isActive: true },
      include: { stock: true, category: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    return lowStock
      .filter((p) => p.stock && p.stock.quantity <= p.stock.minStock)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || "—",
        quantity: p.stock!.quantity,
        minStock: p.stock!.minStock,
        status: p.stock!.quantity === 0 ? "out" : "low",
      }));
  },

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todaySales,
      todayRevenue,
      totalProducts,
      , 
      openDrawers,
    ] = await Promise.all([
      prisma.sale.count({
        where: {
          createdAt: { gte: today },
          status: SaleStatus.COMPLETED,
        },
      }),
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: today },
          status: SaleStatus.COMPLETED,
        },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      0 as number,
      prisma.cashDrawer.count({ where: { status: "OPEN" } }),
    ]);

    const lowStockProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { stock: true, category: { select: { name: true } } },
      take: 5,
      orderBy: { name: "asc" },
    });

    const recentSales = await prisma.sale.findMany({
      where: { status: SaleStatus.COMPLETED },
      include: { employee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const lowStockFiltered = lowStockProducts
      .filter((p) => p.stock && p.stock.quantity <= p.stock.minStock);

    const allLowStock = await prisma.product.findMany({
      where: { isActive: true },
      include: { stock: true },
    });
    const computedLowStockCount = allLowStock.filter(
      (p) => p.stock && p.stock.quantity <= p.stock.minStock,
    ).length;

    return {
      todaySales,
      todayRevenue: Number(todayRevenue._sum.total || 0),
      totalProducts,
      lowStockCount: computedLowStockCount,
      openDrawers,
      lowStockProducts: lowStockFiltered.map((p) => ({
          name: p.name,
          quantity: p.stock!.quantity,
          minStock: p.stock!.minStock,
        })),
      recentSales: recentSales.map((s) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        total: Number(s.total),
        employee: s.employee.name,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  },
};
