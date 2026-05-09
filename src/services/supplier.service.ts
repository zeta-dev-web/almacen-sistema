import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

export const supplierClientService = {
  async create(payload: { name: string; contactName?: string; phone?: string; email?: string }) {
    const { data } = await clientAxios.post(API_ROUTES.SUPPLIERS, payload);
    return data;
  },

  async update(id: string, payload: { name?: string; contactName?: string; phone?: string; email?: string; isActive?: boolean }) {
    const { data } = await clientAxios.put(`${API_ROUTES.SUPPLIERS}/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(`${API_ROUTES.SUPPLIERS}/${id}`);
    return data;
  },

  async findAll(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { data } = await clientAxios.get(API_ROUTES.SUPPLIERS, { params });
    return data;
  },

  async findAllActive() {
    const { data } = await clientAxios.get(API_ROUTES.SUPPLIERS, { params: { isActive: true } });
    return data;
  },
};
