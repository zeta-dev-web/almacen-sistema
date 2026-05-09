import { create } from "zustand";
import Fuse from "fuse.js";

export interface CartItem {
  productId: string;
  name: string;
  barcode: string | null;
  description?: string | null;
  price: number;
  quantity: number;
  stock: number;
}

export interface POSProduct {
  id: string;
  name: string;
  barcode: string | null;
  description?: string | null;
  price: number;
  stock: number;
}

interface PaymentEntry {
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
}

interface CartStore {
  items: CartItem[];
  payments: PaymentEntry[];
  discount: number;
  discountType: "percentage" | "fixed";
  allProducts: POSProduct[];
  fuse: Fuse<POSProduct> | null;
  draftId: string;

  loadCatalog: (products: POSProduct[]) => void;
  search: (query: string) => POSProduct[];
  updateLocalStock: (productId: string, quantityChange: number) => void;
  addItem: (product: CartItem) => void;
  updateQty: (productId: string, qty: number) => void;
  incrementQty: (productId: string) => void;
  decrementQty: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;

  addPayment: (payment: PaymentEntry) => void;
  removePayment: (index: number) => void;
  clearPayments: () => void;

  setDiscount: (value: number, type: "percentage" | "fixed") => void;
  clearDiscount: () => void;

  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getTotalPaid: () => number;
  getRemaining: () => number;

  persistCart: () => void;
  restoreCart: () => boolean;
}

const STORAGE_KEY = "pos-cart-draft";

function generateDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  payments: [],
  discount: 0,
  discountType: "percentage",
  allProducts: [],
  fuse: null,
  draftId: generateDraftId(),

  loadCatalog: (products) => {
    const fuse = new Fuse(products, {
      keys: ["name", "barcode"],
      threshold: 0.3,
      ignoreLocation: true,
    });
    set({ allProducts: products, fuse });
  },

  search: (query) => {
    const { fuse, allProducts } = get();
    if (!fuse || !allProducts.length) return [];
    if (!query.trim()) return allProducts;
    
    return fuse.search(query).map((result) => result.item);
  },

  updateLocalStock: (productId, quantityChange) => {
    set((state) => {
      const updatedProducts = state.allProducts.map((p) =>
        p.id === productId
          ? { ...p, stock: Math.max(0, p.stock + quantityChange) }
          : p
      );
      const fuse = new Fuse(updatedProducts, {
        keys: ["name", "barcode"],
        threshold: 0.3,
        ignoreLocation: true,
      });
      return { allProducts: updatedProducts, fuse };
    });
  },

  addItem: (product) => {
    const { items } = get();
    const existing = items.find((i) => i.productId === product.productId);
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === product.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        ),
      });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
    get().persistCart();
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i,
      ),
    });
    get().persistCart();
  },

  incrementQty: (productId) => {
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    });
    get().persistCart();
  },

  decrementQty: (productId) => {
    const item = get().items.find((i) => i.productId === productId);
    if (!item) return;
    if (item.quantity <= 1) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
      ),
    });
    get().persistCart();
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
    get().persistCart();
  },

  clearCart: () => {
    set({
      items: [],
      payments: [],
      discount: 0,
      draftId: generateDraftId(),
    });
    localStorage.removeItem(STORAGE_KEY);
  },

  addPayment: (payment) => {
    set({ payments: [...get().payments, payment] });
  },

  removePayment: (index) => {
    set({ payments: get().payments.filter((_, i) => i !== index) });
  },

  clearPayments: () => {
    set({ payments: [] });
  },

  setDiscount: (value, type) => {
    set({ discount: value, discountType: type });
  },

  clearDiscount: () => {
    set({ discount: 0, discountType: "percentage" });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getDiscountAmount: () => {
    const { discount, discountType } = get();
    const subtotal = get().getSubtotal();
    if (discountType === "percentage") {
      return (subtotal * discount) / 100;
    }
    return discount;
  },

  getTotal: () => {
    return get().getSubtotal() - get().getDiscountAmount();
  },

  getTotalPaid: () => {
    return get().payments.reduce((sum, p) => sum + p.amount, 0);
  },

  getRemaining: () => {
    return get().getTotal() - get().getTotalPaid();
  },

  persistCart: () => {
    const { items, draftId } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, draftId, timestamp: Date.now() }),
      );
    } catch {}
  },

  restoreCart: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { items, draftId } = JSON.parse(saved);
        if (items?.length > 0) {
          set({ items, draftId: draftId || generateDraftId() });
          return true;
        }
      }
    } catch {}
    return false;
  },
}));
