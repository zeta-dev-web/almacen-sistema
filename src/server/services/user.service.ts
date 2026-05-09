import { employeeRepository } from "@/server/repository/user.repository";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";
import { hashPin } from "@/lib/auth";

export const employeeService = {
  async findById(id: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Empleado no encontrado" });
    }
    return employee;
  },

  async findAll(search?: string) {
    return employeeRepository.findAll(search);
  },

  async create(data: { name: string; username: string; pin: string; role: "ADMIN" | "CASHIER" }) {
    const existing = await employeeRepository.findByUsername(data.username);
    if (existing) {
      throw new ApiError({ status: httpStatus.CONFLICT, message: "El nombre de usuario ya existe" });
    }
    const pinHash = await hashPin(data.pin);
    return employeeRepository.create({
      name: data.name,
      username: data.username,
      pinHash,
      role: data.role,
    });
  },

  async update(id: string, data: { name?: string; username?: string; pin?: string; role?: "ADMIN" | "CASHIER"; isActive?: boolean }) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Empleado no encontrado" });
    }

    if (data.username && data.username !== employee.username) {
      const existing = await employeeRepository.findByUsername(data.username);
      if (existing) {
        throw new ApiError({ status: httpStatus.CONFLICT, message: "El nombre de usuario ya existe" });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.username) updateData.username = data.username;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.pin) updateData.pinHash = await hashPin(data.pin);

    return employeeRepository.update(id, updateData);
  },

  async delete(id: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new ApiError({ status: httpStatus.NOT_FOUND, message: "Empleado no encontrado" });
    }
    return employeeRepository.update(id, { isActive: false });
  },
};