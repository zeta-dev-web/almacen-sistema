import { prisma } from "@/lib/prisma";
import { Employee, Prisma } from "@prisma/client";

type CreateEmployeeDto = Pick<Employee, "name" | "username" | "pinHash" | "role">;

export const employeeRepository = {
  async create(dto: CreateEmployeeDto) {
    return prisma.employee.create({ data: dto });
  },

  async findById(id: string) {
    return prisma.employee.findUnique({ where: { id } });
  },

  async findByUsername(username: string) {
    return prisma.employee.findUnique({ where: { username } });
  },

  async update(id: string, dto: Prisma.EmployeeUpdateInput) {
    return prisma.employee.update({ where: { id }, data: dto });
  },

  async findAll(search?: string) {
    const where = search
      ? { OR: [{ name: { contains: search } }, { username: { contains: search } }] }
      : {};

    return prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  },
};