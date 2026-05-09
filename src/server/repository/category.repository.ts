import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type CategoryCreateInput = Prisma.CategoryCreateInput;
type CategoryUpdateInput = Prisma.CategoryUpdateInput;

export const categoryRepository = {
  async create(data: CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
  },

  async update(id: string, data: CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },

  async findAll(search?: string) {
    const where: Prisma.CategoryWhereInput = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};

    return prisma.category.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  },
};