import { categoryRepository } from "@/server/repository/category.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";
import { prisma } from "@/lib/prisma";

interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
}

interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
}

export const categoryService = {
  async create(dto: CreateCategoryDto) {
    const existing = await prisma.category.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "Ya existe una categoría con ese nombre",
      });
    }

    return categoryRepository.create({
      name: dto.name,
      description: dto.description,
      color: dto.color,
    });
  },

  async findById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Categoría no encontrada",
      });
    }
    return category;
  },

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    if (dto.name) {
      const existing = await prisma.category.findUnique({
        where: { name: dto.name },
      });
      if (existing && existing.id !== id) {
        throw new ApiError({
          status: httpStatus.CONFLICT,
          message: "Ya existe una categoría con ese nombre",
        });
      }
    }

    return categoryRepository.update(id, dto);
  },

  async delete(id: string) {
    const category = await this.findById(id);
    if (category._count.products > 0) {
      throw new ApiError({
        status: httpStatus.CONFLICT,
        message: "No se puede eliminar una categoría con productos asociados",
      });
    }
    return categoryRepository.delete(id);
  },

  async findAll(search?: string) {
    return categoryRepository.findAll(search);
  },
};