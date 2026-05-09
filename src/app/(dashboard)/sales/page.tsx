"use client";

import { useState, useCallback, useEffect } from "react";
import { DataTable } from "@/components/common/DataTable";
import { saleClientService } from "@/services/sale.service";
import { employeeClientService } from "@/services/employee.service";
import { clientErrorHandler } from "@/utils/handlers/clientHandler";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, FilterIcon } from "@hugeicons/core-free-icons";

interface SaleItem {
  product: { name: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface SalePayment {
  paymentMethod: { name: string };
  amount: number;
}

interface Sale {
  id: string;
  receiptNumber: number;
  total: number;
  status: string;
  createdAt: string;
  employee: { id: string; name: string };
  saleItems: SaleItem[];
  salePayments: SalePayment[];
}

interface Employee {
  id: string;
  name: string;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
  REFUNDED: "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
};

const QUICK_RANGES = [
  { label: "Hoy", getDates: () => { const d = new Date(); d.setHours(0,0,0,0); return { from: d, to: d }; } },
  { label: "Ayer", getDates: () => { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); return { from: d, to: d }; } },
  { label: "Semana", getDates: () => { const d = new Date(); const day = d.getDay(); const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); mon.setHours(0,0,0,0); return { from: mon, to: new Date() }; } },
  { label: "Mes", getDates: () => { const d = new Date(); return { from: new Date(d.getFullYear(), d.getMonth(), 1), to: new Date() }; } },
];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [receiptNumber, setReceiptNumber] = useState("");
  const [status, setStatus] = useState("ALL");
  const [employeeId, setEmployeeId] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeQuick, setActiveQuick] = useState("");

  const loadSales = useCallback(async (params?: {
    status?: string;
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    try {
      const result = await saleClientService.findAll({
        page: params?.page || page,
        limit: params?.limit || pageSize,
        ...params,
      });
      setSales(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    employeeClientService.findAll().then((data) => setEmployees(data.items || data)).catch(() => {});
  }, []);

  const handleFilter = () => {
    setPage(1);
    loadSales({
      status: status === "ALL" ? undefined : status,
      employeeId: employeeId === "ALL" ? undefined : employeeId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: 1,
      limit: pageSize,
    });
  };

  const handleClearFilters = () => {
    setStatus("ALL");
    setEmployeeId("ALL");
    setDateFrom("");
    setDateTo("");
    setActiveQuick("");
    setPage(1);
    loadSales({ page: 1, limit: pageSize });
  };

  const hasFilters = status !== "ALL" || employeeId !== "ALL" || dateFrom || dateTo;

  const formatPrice = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

  const columns = [
    {
      key: "receiptNumber",
      label: "#",
      className: "w-16",
      hideOnMobile: true,
      render: (s: Sale) => <span className="text-neutral-500 dark:text-neutral-400 font-mono text-sm">{s.receiptNumber}</span>,
    },
    {
      key: "createdAt",
      label: "Fecha",
      className: "w-44",
      render: (s: Sale) => (
        <span className="text-neutral-600 dark:text-neutral-300 text-sm tabular-nums">
          {new Date(s.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "employee",
      label: "Empleado",
      className: "w-32",
      hideOnMobile: true,
      render: (s: Sale) => <span className="text-neutral-600 dark:text-neutral-300">{s.employee.name}</span>,
    },
    {
      key: "items",
      label: "Items",
      className: "w-12 text-center",
      hideOnMobile: true,
      render: (s: Sale) => <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">{s.saleItems?.length || 0}</span>,
    },
    {
      key: "total",
      label: "Total",
      className: "w-28 text-right",
      render: (s: Sale) => <span className="text-neutral-900 dark:text-white font-medium tabular-nums">${formatPrice(s.total)}</span>,
    },
    {
      key: "status",
      label: "Estado",
      className: "w-28",
      hideOnMobile: true,
      render: (s: Sale) => (
        <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${STATUS_STYLES[s.status] || "bg-neutral-100 dark:bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"}`}>
          {STATUS_LABELS[s.status] || s.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-16 text-right",
      render: (s: Sale) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedSale(s); setDetailOpen(true); }} className="h-9 w-9 md:h-8 md:w-8">
          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Ventas"
        subtitle="Historial de ventas realizadas"
        columns={columns}
        data={sales}
        keyExtractor={(s) => s.id}
        loading={loading}
        totalLabel={`${total} ventas`}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: (p) => { 
            setPage(p); 
            loadSales({ 
              status: status === "ALL" ? undefined : status,
              employeeId: employeeId === "ALL" ? undefined : employeeId,
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
              page: p, 
              limit: pageSize,
            }); 
          },
          onPageSizeChange: (s) => { 
            setPageSize(s); 
            setPage(1); 
            loadSales({ 
              status: status === "ALL" ? undefined : status,
              employeeId: employeeId === "ALL" ? undefined : employeeId,
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
              page: 1, 
              limit: s,
            }); 
          },
        }}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex gap-1">
              {QUICK_RANGES.map((r) => (
                <Button
                  key={r.label}
                  variant={activeQuick === r.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const { from, to } = r.getDates();
                    setDateFrom(from.toISOString().split("T")[0]);
                    setDateTo(to.toISOString().split("T")[0]);
                    setActiveQuick(r.label);
                    setPage(1);
                    loadSales({
                      status: status === "ALL" ? undefined : status,
                      employeeId: employeeId === "ALL" ? undefined : employeeId,
                      dateFrom: from.toISOString().split("T")[0],
                      dateTo: to.toISOString().split("T")[0],
                      page: 1,
                      limit: pageSize,
                    });
                  }}
                  className="h-9 text-sm"
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Estado</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-36 h-9 text-sm border-2 border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="COMPLETED">Completada</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    <SelectItem value="REFUNDED">Reembolsada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Empleado</span>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="w-36 h-9 text-sm border-2 border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20">
                    <SelectValue placeholder="Empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Desde</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-36 h-9 text-sm border-2 border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Hasta</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-36 h-9 text-sm border-2 border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
            {hasFilters && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-transparent">.</span>
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white h-9">
                  <HugeiconsIcon icon={FilterIcon} strokeWidth={2} className="size-3.5 mr-1" />
                  Limpiar
                </Button>
              </div>
            )}
          </div>
        }
      />

      <GenericModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={`Venta #${selectedSale?.receiptNumber || ""}`}
        description={selectedSale ? new Date(selectedSale.createdAt).toLocaleString("es-AR") : ""}
        size="lg"
        footer={<Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>}
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Empleado</p>
                <p className="text-base font-medium text-neutral-900 dark:text-white">{selectedSale.employee.name}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Estado</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-sm font-medium ${STATUS_STYLES[selectedSale.status] || "bg-neutral-100 dark:bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"}`}>
                  {STATUS_LABELS[selectedSale.status] || selectedSale.status}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase">Productos</h3>
              {selectedSale.saleItems?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300">{item.product?.name || "—"} x{item.quantity}</span>
                  <span className="text-neutral-900 dark:text-white tabular-nums">${formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 space-y-2">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase">Pagos</h3>
              {selectedSale.salePayments?.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">{p.paymentMethod?.name || "—"}</span>
                  <span className="text-neutral-900 dark:text-white tabular-nums">${formatPrice(p.amount)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 flex justify-between font-bold text-lg">
              <span className="text-neutral-900 dark:text-white">Total</span>
              <span className="text-red-600 dark:text-red-500 tabular-nums">${formatPrice(selectedSale.total)}</span>
            </div>
          </div>
        )}
      </GenericModal>
    </>
  );
}