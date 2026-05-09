import { prisma } from "@/lib/prisma";
import { CashDrawerStatus, TransactionType } from "@prisma/client";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";
import { getCurrentEmployee } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { cashDrawerRepository } from "@/server/repository/cashDrawer.repository";

export const cashDrawerService = {
  async open(openAmount: number) {
    const employee = await getCurrentEmployee();
    if (!employee) {
      throw new ApiError({ status: httpStatus.UNAUTHORIZED, message: "No autorizado" });
    }

    const existing = await cashDrawerRepository.findOpenByEmployee(employee.id);
    if (existing) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "Ya tiene una caja abierta. Ciérrela antes de abrir una nueva.",
      });
    }

    const drawer = await prisma.$transaction(async (tx) => {
      const newDrawer = await tx.cashDrawer.create({
        data: {
          employeeId: employee.id,
          openAmount: new Prisma.Decimal(openAmount),
          status: CashDrawerStatus.OPEN,
        },
      });

      await tx.transaction.create({
        data: {
          cashDrawerId: newDrawer.id,
          type: TransactionType.OPENING,
          amount: new Prisma.Decimal(openAmount),
          description: "Apertura de caja",
          createdById: employee.id,
        },
      });

      return tx.cashDrawer.findUnique({
        where: { id: newDrawer.id },
        include: {
          employee: { select: { name: true } },
          transactions: { include: { paymentMethod: true } },
        },
      });
    });

    return {
      ...drawer,
      openAmount: Number(drawer?.openAmount),
      closeAmount: drawer?.closeAmount ? Number(drawer.closeAmount) : null,
      transactions: drawer?.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    };
  },

  async close(id: string, closeAmount: number, closeNote?: string) {
    const employee = await getCurrentEmployee();
    if (!employee) {
      throw new ApiError({ status: httpStatus.UNAUTHORIZED, message: "No autorizado" });
    }

    const drawer = await cashDrawerRepository.findById(id);
    if (!drawer) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Caja no encontrada" });
    }
    if (drawer.status !== CashDrawerStatus.OPEN) {
      throw new ApiError({ status: httpStatus.BAD_REQUEST, message: "La caja ya está cerrada" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.cashDrawer.update({
        where: { id },
        data: {
          closeAmount: new Prisma.Decimal(closeAmount),
          closeNote: closeNote || null,
          closeDate: new Date(),
          status: CashDrawerStatus.CLOSED,
        },
      });

      await tx.transaction.create({
        data: {
          cashDrawerId: id,
          type: TransactionType.CLOSING,
          amount: new Prisma.Decimal(closeAmount),
          description: "Cierre de caja",
          createdById: employee.id,
        },
      });

      return tx.cashDrawer.findUnique({
        where: { id },
        include: {
          employee: { select: { name: true } },
          transactions: {
            include: { paymentMethod: true, createdBy: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
          sales: {
            include: { salePayments: { include: { paymentMethod: true } } },
          },
        },
      });
    });

    return {
      ...result,
      openAmount: Number(result?.openAmount),
      closeAmount: result?.closeAmount ? Number(result.closeAmount) : null,
      transactions: result?.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      sales: result?.sales.map((s) => ({
        ...s,
        total: Number(s.total),
        salePayments: s.salePayments.map((sp) => ({
          ...sp,
          amount: Number(sp.amount),
        })),
      })),
    };
  },

  async addTransaction(cashDrawerId: string, type: TransactionType, amount: number, description?: string, paymentMethodId?: string) {
    const employee = await getCurrentEmployee();
    if (!employee) {
      throw new ApiError({ status: httpStatus.UNAUTHORIZED, message: "No autorizado" });
    }

    const drawer = await cashDrawerRepository.findById(cashDrawerId);
    if (!drawer) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Caja no encontrada" });
    }
    if (drawer.status !== CashDrawerStatus.OPEN) {
      throw new ApiError({ status: httpStatus.BAD_REQUEST, message: "La caja está cerrada" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        cashDrawerId,
        type,
        amount: new Prisma.Decimal(amount),
        description,
        paymentMethodId,
        createdById: employee.id,
      },
      include: {
        paymentMethod: true,
        createdBy: { select: { name: true } },
      },
    });

    return { ...transaction, amount: Number(transaction.amount) };
  },

  async getOpenDrawer(employeeId: string) {
    const drawer = await cashDrawerRepository.findOpenByEmployee(employeeId);
    if (!drawer) return null;

    const full = await cashDrawerRepository.findById(drawer.id);
    return {
      ...full,
      openAmount: Number(full?.openAmount),
      closeAmount: full?.closeAmount ? Number(full.closeAmount) : null,
      transactions: full?.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      sales: full?.sales?.map((s) => ({
        ...s,
        total: Number(s.total),
        salePayments: s.salePayments.map((sp) => ({
          ...sp,
          amount: Number(sp.amount),
        })),
      })),
    };
  },

  async findAll(params: { status?: string; employeeId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const { status, employeeId, dateFrom, dateTo, page = 1, limit = 50 } = params;
    const result = await cashDrawerRepository.findAll({
      status: status as CashDrawerStatus | undefined,
      employeeId,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return {
      ...result,
      items: result.items.map((d) => ({
        ...d,
        openAmount: Number(d.openAmount),
        closeAmount: d.closeAmount ? Number(d.closeAmount) : null,
      })),
    };
  },

  async findById(id: string) {
    const drawer = await cashDrawerRepository.findById(id);
    if (!drawer) return null;
    return {
      ...drawer,
      openAmount: Number(drawer.openAmount),
      closeAmount: drawer.closeAmount ? Number(drawer.closeAmount) : null,
      transactions: drawer.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      sales: drawer.sales.map((s) => ({
        ...s,
        total: Number(s.total),
        salePayments: s.salePayments.map((sp) => ({
          ...sp,
          amount: Number(sp.amount),
        })),
      })),
    };
  },
};
