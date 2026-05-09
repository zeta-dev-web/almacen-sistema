import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ProductCreateInput = Prisma.ProductCreateInput;
type ProductUpdateInput = Prisma.ProductUpdateInput;

interface FindAllParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const productRepository = {
  async create(data: ProductCreateInput) {
    return prisma.product.create({
      data,
      include: { category: true, stock: true },
    });
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true, stock: true },
    });
  },

  async findByBarcode(barcode: string) {
    return prisma.product.findUnique({
      where: { barcode },
      include: { category: true, stock: true },
    });
  },

  async update(id: string, data: ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true, stock: true },
    });
  },

  async delete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async findAll({ search, categoryId, isActive, page = 1, limit = 50 }: FindAllParams) {
    const where: Prisma.ProductWhereInput = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          barcode: true,
          name: true,
          description: true,
          price: true,
          costPrice: true,
          categoryId: true,
          isActive: true,
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          stock: {
            select: {
              quantity: true,
              minStock: true,
              maxStock: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page, limit };
  },
};