import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

interface SaleItemPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface SalePaymentPayload {
  paymentMethodId: string;
  amount: number;
}

export interface CreateSalePayload {
  items: SaleItemPayload[];
  payments: SalePaymentPayload[];
  cashDrawerId?: string;
  discount?: number;
  discountType?: "percentage" | "fixed";
}

export const saleClientService = {
  async create(payload: CreateSalePayload) {
    const { data } = await clientAxios.post(API_ROUTES.SALES, payload);
    return data;
  },

  async findAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
    receiptNumber?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { data } = await clientAxios.get(API_ROUTES.SALES, { params });
    return data;
  },
};