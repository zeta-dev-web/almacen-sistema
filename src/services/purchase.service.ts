import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

interface PurchaseItemPayload {
  productId: string;
  quantity: number;
  costPrice: number;
}

export const purchaseClientService = {
  async create(payload: { supplierId: string; items: PurchaseItemPayload[] }) {
    const { data } = await clientAxios.post(API_ROUTES.PURCHASES, payload);
    return data;
  },

  async findAll(params?: { page?: number; limit?: number; supplierId?: string; dateFrom?: string; dateTo?: string }) {
    const { data } = await clientAxios.get(API_ROUTES.PURCHASES, { params });
    return data;
  },
};
