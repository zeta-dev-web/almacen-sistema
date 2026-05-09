import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

export interface StockAdjustmentPayload {
  productId: string;
  type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  quantity: number;
  reason: string;
}

export const stockClientService = {
  async adjust(payload: StockAdjustmentPayload) {
    const { data } = await clientAxios.post(API_ROUTES.STOCK, payload);
    return data;
  },

  async getMovements(params?: {
    productId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { data } = await clientAxios.get(API_ROUTES.STOCK_MOVEMENTS, {
      params,
    });
    return data;
  },
};