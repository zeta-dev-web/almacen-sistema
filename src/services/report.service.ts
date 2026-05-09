import clientAxios from "@/utils/clientAxios.util";

export const reportClientService = {
  async getDashboard() {
    const { data } = await clientAxios.get("/api/reports?type=dashboard");
    return data;
  },

  async getSalesSummary(params?: { from?: string; to?: string; employeeId?: string; paymentMethodId?: string; categoryId?: string }) {
    const { data } = await clientAxios.get("/api/reports", {
      params: { type: "sales", ...params },
    });
    return data;
  },

  async getStockAlerts() {
    const { data } = await clientAxios.get("/api/reports?type=stock-alerts");
    return data;
  },
};
