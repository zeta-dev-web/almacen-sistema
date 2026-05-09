import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

export interface ProductPayload {
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  categoryId: string;
  initialStock?: number;
  minStock?: number;
}

export const productClientService = {
  async findAll(params?: {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { data } = await clientAxios.get(API_ROUTES.PRODUCTS, { params });
    return data;
  },

  async findAllActive() {
    const { data } = await clientAxios.get(API_ROUTES.PRODUCTS, {
      params: { activeOnly: "true" },
    });
    return data;
  },

  async findById(id: string) {
    const { data } = await clientAxios.get(`${API_ROUTES.PRODUCTS}/${id}`);
    return data;
  },

  async create(payload: ProductPayload) {
    const { data } = await clientAxios.post(API_ROUTES.PRODUCTS, payload);
    return data;
  },

  async update(id: string, payload: Partial<ProductPayload> & { isActive?: boolean; minStock?: number; maxStock?: number }) {
    const { data } = await clientAxios.put(`${API_ROUTES.PRODUCTS}/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(`${API_ROUTES.PRODUCTS}/${id}`);
    return data;
  },
};