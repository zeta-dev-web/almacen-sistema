"use client";

import { useState, useCallback, useRef } from "react";
import { reportClientService } from "@/services/report.service";
import { clientErrorHandler } from "@/utils/handlers/clientHandler";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart01Icon } from "hugeicons-react";
import { PackageIcon, Alert02Icon, Money01Icon } from "@hugeicons/core-free-icons";

interface DashboardData {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  openDrawers: number;
  lowStockProducts: { name: string; quantity: number; minStock: number }[];
  recentSales: { id: string; receiptNumber: number; total: number; employee: string; createdAt: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef<boolean | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportClientService.getDashboard();
      setStats(result);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (initialLoadDone.current == null) {
    initialLoadDone.current = true;
    loadStats();
  }

  const formatPrice = (n: number) =>
    n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Resumen del día</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-500/10">
              <HugeiconsIcon icon={Money01Icon} strokeWidth={2} className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Ventas del día</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">${formatPrice(stats.todayRevenue)}</p>
<p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{stats.todaySales} transacciones</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">en inventario</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">productos con stock bajo</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">activas ahora</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-4">Últimas ventas</h2>
          <div className="space-y-2">
            {stats.recentSales.length === 0 && (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">No hay ventas hoy</p>
            )}
            {stats.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div>
                  <span className="text-neutral-900 dark:text-white font-mono text-sm">#{sale.receiptNumber}</span>
                  <span className="text-neutral-400 dark:text-neutral-500 text-xs ml-2">{sale.employee}</span>
                </div>
                <span className="text-neutral-900 dark:text-white font-medium tabular-nums">${formatPrice(sale.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-4">Stock bajo</h2>
          <div className="space-y-2">
            {stats.lowStockProducts.length === 0 && (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">Todo el stock está bien</p>
            )}
            {stats.lowStockProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <span className="text-neutral-900 dark:text-white text-sm">{product.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium tabular-nums ${
                    product.quantity === 0 ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
                  }`}>
                    {product.quantity}/{product.minStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}