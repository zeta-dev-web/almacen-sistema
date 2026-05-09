import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface FindAllParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const supplierRepository = {
  async create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data });
  },

  async findById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: { 
        purchases: { 
          include: { 
            items: { 
              include: { product: { select: { id: true, name: true } } } 
            } 
          }, 
          orderBy: { createdAt: "desc" },
          take: 10
        } 
      },
    });
  },

  async update(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async findAll({ search, isActive, page = 1, limit = 50 }: FindAllParams) {
    const where: Prisma.SupplierWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  async findAllActive() {
    return prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  },
};
