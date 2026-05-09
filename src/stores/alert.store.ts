import { create } from "zustand";

interface StockAlert {
  id: string;
  productId: string;
  quantity: number;
  minStock: number;
  createdAt: string;
  product: {
    id: string;
    name: string;
    stock: {
      quantity: number;
      minStock: number;
    } | null;
  };
}

interface AlertStore {
  alerts: StockAlert[];
  count: number;
  loading: boolean;
  loadAlerts: () => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  playNotificationSound: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  count: 0,
  loading: false,

  loadAlerts: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/alerts");
      const alerts = await response.json();
      const previousCount = get().count;
      set({ alerts, count: alerts.length, loading: false });
      
      if (alerts.length > previousCount && previousCount > 0) {
        get().playNotificationSound();
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      set({ loading: false });
    }
  },

  dismissAlert: async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: "PATCH" });
      const alerts = get().alerts.filter((a) => a.id !== id);
      set({ alerts, count: alerts.length });
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  },

  playNotificationSound: () => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  },
}));
