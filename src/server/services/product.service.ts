import { productRepository } from "@/server/repository/product.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface CreateProductDto {
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  categoryId: string;
  initialStock?: number;
  minStock?: number;
}

interface UpdateProductDto {
  barcode?: string;
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  categoryId?: string;
  isActive?: boolean;
  minStock?: number;
  maxStock?: number;
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value);
}

export const productService = {
  async create(dto: CreateProductDto) {
    if (dto.barcode) {
      const existing = await productRepository.findByBarcode(dto.barcode);
      if (existing) {
        throw new ApiError({
          status: httpStatus.CONFLICT,
          message: "Ya existe un producto con ese código de barras",
        });
      }
    }

    const category = await prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Categoría no encontrada",
      });
    }

    const product = await productRepository.create({
      barcode: dto.barcode,
      name: dto.name,
      description: dto.description,
      price: toDecimal(dto.price),
      costPrice: toDecimal(dto.costPrice),
      category: { connect: { id: dto.categoryId } },
      stock: {
        create: {
          quantity: dto.initialStock || 0,
          minStock: dto.minStock || 5,
        },
      },
    });

    return product;
  },

  async findById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Producto no encontrado",
      });
    }
    return product;
  },

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    if (dto.barcode) {
      const existing = await productRepository.findByBarcode(dto.barcode);
      if (existing && existing.id !== id) {
        throw new ApiError({
          status: httpStatus.CONFLICT,
          message: "Ya existe un producto con ese código de barras",
        });
      }
    }

    const data: Prisma.ProductUpdateInput = {};
    if (dto.barcode !== undefined) data.barcode = dto.barcode;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = toDecimal(dto.price);
    if (dto.costPrice !== undefined) data.costPrice = toDecimal(dto.costPrice);
    if (dto.categoryId !== undefined)
      data.category = { connect: { id: dto.categoryId } };
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.minStock !== undefined || dto.maxStock !== undefined) {
      data.stock = {
        update: {
          ...(dto.minStock !== undefined && { minStock: dto.minStock }),
          ...(dto.maxStock !== undefined && { maxStock: dto.maxStock }),
        },
      };
    }

    return productRepository.update(id, data);
  },

  async delete(id: string) {
    await this.findById(id);
    return productRepository.delete(id);
  },

  async findAll(params: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    return productRepository.findAll(params);
  },

  async findAllActive() {
    const result = await productRepository.findAll({ isActive: true, limit: 9999 });
    return result.items;
  },
};