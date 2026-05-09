import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

export const cashDrawerClientService = {
  async open(openAmount: number) {
    const { data } = await clientAxios.post(API_ROUTES.CASHDRAWER, { openAmount });
    return data;
  },

  async close(id: string, closeAmount: number, closeNote?: string) {
    const { data } = await clientAxios.put(`${API_ROUTES.CASHDRAWER}/${id}`, {
      action: "close",
      closeAmount,
      closeNote,
    });
    return data;
  },

  async findAll(params?: { status?: string; employeeId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const { data } = await clientAxios.get(API_ROUTES.CASHDRAWER, { params });
    return data;
  },

  async findById(id: string) {
    const { data } = await clientAxios.get(`${API_ROUTES.CASHDRAWER}/${id}`);
    return data;
  },

  async addTransaction(cashDrawerId: string, payload: {
    type: string;
    amount: number;
    description?: string;
    paymentMethodId?: string;
  }) {
    const { data } = await clientAxios.post(
      `${API_ROUTES.CASHDRAWER}/${cashDrawerId}/transactions`,
      payload,
    );
    return data;
  },
};
