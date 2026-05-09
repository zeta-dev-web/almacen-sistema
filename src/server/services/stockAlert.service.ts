import { stockAlertRepository } from "@/server/repository/stockAlert.repository";

export const stockAlertService = {
  async createAlert(productId: string, quantity: number, minStock: number) {
    return stockAlertRepository.create(productId, quantity, minStock);
  },

  async getActiveAlerts() {
    return stockAlertRepository.findActive();
  },

  async dismissAlert(id: string) {
    return stockAlertRepository.dismiss(id);
  },

  async getActiveCount() {
    return stockAlertRepository.countActive();
  },
};
