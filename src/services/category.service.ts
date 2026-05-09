import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

export interface CategoryPayload {
  name: string;
  description?: string;
  color?: string;
}

export const categoryClientService = {
  async findAll(params?: { search?: string; page?: number; limit?: number }) {
    const { data } = await clientAxios.get(API_ROUTES.CATEGORIES, { params });
    return data;
  },

  async create(payload: CategoryPayload) {
    const { data } = await clientAxios.post(API_ROUTES.CATEGORIES, payload);
    return data;
  },

  async update(id: string, payload: Partial<CategoryPayload>) {
    const { data } = await clientAxios.put(`${API_ROUTES.CATEGORIES}/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(`${API_ROUTES.CATEGORIES}/${id}`);
    return data;
  },
};