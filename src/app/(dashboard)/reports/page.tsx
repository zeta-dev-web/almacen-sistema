"use client";

import { useState, useCallback, useEffect } from "react";
import { reportClientService } from "@/services/report.service";
import { employeeClientService } from "@/services/employee.service";
import { categoryClientService } from "@/services/category.service";
import { clientErrorHandler } from "@/utils/handlers/clientHandler";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

interface SalesSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalSales: number;
  avgTicket: number;
  topProducts: { name: string; quantity: number; revenue: number; cost: number }[];
  paymentMethods: { name: string; amount: number; count: number }[];
  period: { from: string; to: string };
}

interface StockAlert {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  status: "out" | "low";
}

interface Employee { id: string; name: string; }
interface Category { id: string; name: string; }
interface PaymentMethod { id: string; name: string; }

function todayAR(): Date {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

const QUICK_RANGES = [
  { label: "Hoy", getDates: () => { const d = todayAR(); return { from: d, to: undefined }; } },
  { label: "Ayer", getDates: () => { const d = todayAR(); d.setDate(d.getDate() - 1); return { from: d, to: undefined }; } },
  { label: "Esta semana", getDates: () => { const d = todayAR(); const day = d.getDay(); const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return { from: mon, to: todayAR() }; } },
  { label: "Este mes", getDates: () => { const d = todayAR(); return { from: new Date(d.getFullYear(), d.getMonth(), 1), to: todayAR() }; } },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<"sales" | "stock">("sales");
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(todayAR());
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [employeeId, setEmployeeId] = useState("ALL");
  const [paymentMethodId, setPaymentMethodId] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [activeQuick, setActiveQuick] = useState("Hoy");

  const loadSalesReport = useCallback(async (from: Date, to?: Date, empId?: string, pmId?: string, catId?: string) => {
    setLoading(true);
    try {
      const result = await reportClientService.getSalesSummary({
        from: toStr(from),
        to: toStr(to ?? from),
        employeeId: empId && empId !== "ALL" ? empId : undefined,
        paymentMethodId: pmId && pmId !== "ALL" ? pmId : undefined,
        categoryId: catId && catId !== "ALL" ? catId : undefined,
      });
      setSalesSummary(result);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStockAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportClientService.getStockAlerts();
      setStockAlerts(result);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesReport(todayAR());
    employeeClientService.findAll().then((d) => setEmployees(d.items || d)).catch(() => {});
    categoryClientService.findAll().then((d) => setCategories(Array.isArray(d) ? d : d.items || [])).catch(() => {});
    fetch("/api/payment-methods").then(r => r.json()).then(setPaymentMethods).catch(() => {});
  }, []);

  const handleQuickRange = (label: string, getDates: () => { from: Date; to?: Date }) => {
    const { from, to } = getDates();
    setFromDate(from);
    setToDate(to);
    setActiveQuick(label);
    loadSalesReport(from, to, employeeId, paymentMethodId, categoryId);
  };

  const handleConsult = () => {
    setActiveQuick("");
    loadSalesReport(fromDate, toDate, employeeId, paymentMethodId, categoryId);
  };

  const handleClear = () => {
    const today = todayAR();
    setFromDate(today);
    setToDate(undefined);
    setEmployeeId("ALL");
    setPaymentMethodId("ALL");
    setCategoryId("ALL");
    setActiveQuick("Hoy");
    loadSalesReport(today);
  };

  const hasFilters = employeeId !== "ALL" || paymentMethodId !== "ALL" || categoryId !== "ALL" || toDate || toStr(fromDate) !== toStr(todayAR());

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reportes</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Análisis de ventas y stock</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "sales" ? "default" : "outline"} size="sm" onClick={() => { setTab("sales"); }}>Ventas</Button>
        <Button variant={tab === "stock" ? "default" : "outline"} size="sm" onClick={() => { setTab("stock"); if (stockAlerts.length === 0) loadStockAlerts(); }}>Alertas de Stock</Button>
      </div>

      {tab === "sales" && (
        <div className="space-y-5">
          {/* Rangos rápidos */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_RANGES.map((r) => (
              <Button
                key={r.label}
                variant={activeQuick === r.label ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickRange(r.label, r.getDates)}
              >
                {r.label}
              </Button>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs text-neutral-500">Desde</Label>
              <DatePicker date={fromDate} onDateChange={(d) => { if (d) { setFromDate(d); setActiveQuick(""); } }} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-neutral-500">Hasta <span className="text-neutral-600">(opcional)</span></Label>
              <DatePicker date={toDate} onDateChange={(d) => { setToDate(d); setActiveQuick(""); }} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-neutral-500">Empleado</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-neutral-500">Método de pago</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {paymentMethods.map((pm) => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-neutral-500">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleConsult} disabled={loading}>
              {loading ? "Cargando..." : "Consultar"}
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-neutral-500 hover:text-red-400">
                Limpiar
              </Button>
            )}
          </div>

          <p className="text-xs text-neutral-500">
            Período: <span className="text-neutral-300 font-medium">{toStr(fromDate)}</span>
            {toDate && toStr(toDate) !== toStr(fromDate) && <> → <span className="text-neutral-300 font-medium">{toStr(toDate)}</span></>}
          </p>

          {salesSummary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                  <p className="text-xs text-neutral-500 uppercase">Vendido</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">${fmt(salesSummary.totalRevenue)}</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                  <p className="text-xs text-neutral-500 uppercase">Ganancia neta</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">${fmt(salesSummary.totalProfit)}</p>
                  <p className="text-xs text-neutral-500 mt-1">Costo: ${fmt(salesSummary.totalCost)}</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                  <p className="text-xs text-neutral-500 uppercase">Ventas</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">{salesSummary.totalSales}</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                  <p className="text-xs text-neutral-500 uppercase">Ticket promedio</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">${fmt(salesSummary.avgTicket)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase mb-4">Top productos</h2>
                  <div className="space-y-2">
                    {salesSummary.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <div>
                          <span className="text-neutral-900 dark:text-white text-sm">{p.name}</span>
                          <span className="text-neutral-400 text-xs ml-2">x{p.quantity}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-neutral-900 dark:text-white font-medium tabular-nums text-sm">${fmt(p.revenue)}</p>
                          <p className="text-blue-500 text-xs tabular-nums">+${fmt(p.revenue - p.cost)}</p>
                        </div>
                      </div>
                    ))}
                    {salesSummary.topProducts.length === 0 && <p className="text-neutral-400 text-sm">Sin datos</p>}
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase mb-4">Métodos de pago</h2>
                  <div className="space-y-2">
                    {salesSummary.paymentMethods.map((pm, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <div>
                          <span className="text-neutral-900 dark:text-white text-sm">{pm.name}</span>
                          <span className="text-neutral-400 text-xs ml-2">({pm.count} ventas)</span>
                        </div>
                        <span className="text-neutral-900 dark:text-white font-medium tabular-nums">${fmt(pm.amount)}</span>
                      </div>
                    ))}
                    {salesSummary.paymentMethods.length === 0 && <p className="text-neutral-400 text-sm">Sin datos</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "stock" && (
        <div className="space-y-4">
          {stockAlerts.length === 0 && !loading && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center">
              <p className="text-neutral-500">Todos los productos tienen stock suficiente</p>
            </div>
          )}
          {stockAlerts.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className={`size-5 ${alert.status === "out" ? "text-red-500" : "text-yellow-500"}`} />
                <div>
                  <p className="text-neutral-900 dark:text-white text-sm font-medium">{alert.name}</p>
                  <p className="text-neutral-500 text-xs">{alert.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium tabular-nums ${alert.status === "out" ? "text-red-500" : "text-yellow-500"}`}>
                  {alert.quantity} / {alert.minStock}
                </p>
                <p className="text-xs text-neutral-400">{alert.status === "out" ? "Sin stock" : "Bajo"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
