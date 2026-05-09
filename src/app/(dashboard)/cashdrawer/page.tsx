"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DataTable } from "@/components/common/DataTable";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cashDrawerClientService } from "@/services/cashDrawer.service";
import { employeeClientService } from "@/services/employee.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { toast } from "sonner";
import { Pagination } from "@/components/common";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ViewIcon, Money01Icon } from "@hugeicons/core-free-icons";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  paymentMethod: { name: string } | null;
  createdBy: { name: string };
}

interface SalePayment {
  amount: number;
  paymentMethod: { name: string; type?: string };
}

interface Sale {
  id: string;
  total: number;
  receiptNumber: number;
  salePayments: SalePayment[];
}

interface CashDrawer {
  id: string;
  openAmount: number;
  closeAmount: number | null;
  openDate: string;
  closeDate: string | null;
  status: string;
  employee: { name: string };
  transactions?: Transaction[];
  sales?: Sale[];
}

interface CloseReport {
  salesTotal: number;
  byMethod: { name: string; amount: number }[];
  expectedCash: number;
}

const TX_TYPE_STYLES: Record<string, string> = {
  OPENING: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
  CLOSING: "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400",
  SALE: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400",
  EXPENSE: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
  WITHDRAWAL: "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400",
  DEPOSIT: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
};

const TX_TYPE_LABELS: Record<string, string> = {
  OPENING: "Apertura",
  CLOSING: "Cierre",
  SALE: "Venta",
  EXPENSE: "Gasto",
  WITHDRAWAL: "Retiro",
  DEPOSIT: "Depósito",
};

interface Employee { id: string; name: string; }

export default function CashDrawerPage() {
  const [drawers, setDrawers] = useState<CashDrawer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterEmployeeId, setFilterEmployeeId] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openAmount, setOpenAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDrawer, setSelectedDrawer] = useState<CashDrawer | null>(null);
  const [closeModal, setCloseModal] = useState(false);
  const [closingDrawer, setClosingDrawer] = useState<CashDrawer | null>(null);
  const [closeAmount, setCloseAmount] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [closeReport, setCloseReport] = useState<CloseReport | null>(null);
  const [txModal, setTxModal] = useState(false);
  const [txType, setTxType] = useState("EXPENSE");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");

  const loadDrawers = useCallback(async (empId?: string, status?: string, dateFrom?: string, dateTo?: string, p?: number, ps?: number) => {
    setLoading(true);
    try {
      const result = await cashDrawerClientService.findAll({
        page: p || page,
        limit: ps || pageSize,
        employeeId: empId && empId !== "ALL" ? empId : undefined,
        status: status && status !== "ALL" ? status : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setDrawers(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadDrawers();
    employeeClientService.findAll().then((d) => setEmployees(d.items || d)).catch(() => {});
  }, []);

  const handleOpen = async () => {
    if (!openAmount || parseFloat(openAmount) < 0) {
      toast.error("Ingrese un monto válido");
      return;
    }
    setSaving(true);
    try {
      await cashDrawerClientService.open(parseFloat(openAmount));
      clientSuccessHandler("Caja abierta correctamente");
      setOpenModal(false);
      setOpenAmount("");
      loadDrawers(filterEmployeeId, filterStatus, filterDateFrom, filterDateTo, page, pageSize);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setSaving(false);
    }
  };

  const openCloseModal = async (drawer: CashDrawer) => {
    try {
      const detail = await cashDrawerClientService.findById(drawer.id);
      const byMethod: Record<string, { name: string; amount: number }> = {};
      detail.sales?.forEach((sale: Sale) => {
        sale.salePayments?.forEach((sp: SalePayment) => {
          const key = sp.paymentMethod.name;
          if (!byMethod[key]) byMethod[key] = { name: key, amount: 0 };
          byMethod[key].amount += sp.amount;
        });
      });
      const salesTotal = detail.sales?.reduce((s: number, sale: Sale) => s + sale.total, 0) || 0;
      const txExpenses = detail.transactions
        ?.filter((t: Transaction) => ["EXPENSE", "WITHDRAWAL"].includes(t.type))
        .reduce((s: number, t: Transaction) => s + t.amount, 0) || 0;
      const txDeposits = detail.transactions
        ?.filter((t: Transaction) => t.type === "DEPOSIT")
        .reduce((s: number, t: Transaction) => s + t.amount, 0) || 0;
      const cashSales = byMethod["Efectivo"]?.amount || 0;
      const expectedCash = drawer.openAmount + cashSales + txDeposits - txExpenses;
      setCloseReport({ salesTotal, byMethod: Object.values(byMethod), expectedCash });
      setClosingDrawer(drawer);
      setCloseAmount(String(Math.round(expectedCash)));
      setCloseNote("");
      setCloseModal(true);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const handleClose = async () => {
    if (!closingDrawer || !closeAmount) return;
    const diff = Math.abs(parseFloat(closeAmount) - (closeReport?.expectedCash || 0));
    if (diff >= 1 && !closeNote.trim()) {
      toast.error("Ingresá una observación para justificar la diferencia");
      return;
    }
    setSaving(true);
    try {
      await cashDrawerClientService.close(closingDrawer.id, parseFloat(closeAmount), closeNote || undefined);
      clientSuccessHandler("Caja cerrada correctamente");
      setCloseModal(false);
      setCloseAmount("");
      setCloseNote("");
      setClosingDrawer(null);
      setCloseReport(null);
      loadDrawers(filterEmployeeId, filterStatus, filterDateFrom, filterDateTo, page, pageSize);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedDrawer || !txAmount) return;
    setSaving(true);
    try {
      await cashDrawerClientService.addTransaction(selectedDrawer.id, {
        type: txType,
        amount: parseFloat(txAmount),
        description: txDescription || undefined,
      });
      clientSuccessHandler("Transacción registrada");
      setTxModal(false);
      setTxAmount("");
      setTxDescription("");
      const detail = await cashDrawerClientService.findById(selectedDrawer.id);
      setSelectedDrawer(detail);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setSaving(false);
    }
  };

  const viewDetail = async (drawer: CashDrawer) => {
    try {
      const detail = await cashDrawerClientService.findById(drawer.id);
      setSelectedDrawer(detail);
      setDetailOpen(true);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

  const columns = [
    {
      key: "openDate",
      label: "Apertura",
      className: "w-40",
      render: (d: CashDrawer) => (
        <span className="text-neutral-300 text-xs tabular-nums">
          {new Date(d.openDate).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "employee",
      label: "Empleado",
      className: "w-32",
      render: (d: CashDrawer) => <span className="text-neutral-300">{d.employee?.name || "—"}</span>,
    },
    {
      key: "openAmount",
      label: "Efectivo inicial",
      className: "w-28 text-right",
      render: (d: CashDrawer) => <span className="text-white tabular-nums">${fmt(d.openAmount)}</span>,
    },
    {
      key: "closeAmount",
      label: "Cierre $",
      className: "w-28 text-right",
      render: (d: CashDrawer) => (
        <span className="tabular-nums">{d.closeAmount != null ? `$${fmt(d.closeAmount)}` : "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      className: "w-24",
      render: (d: CashDrawer) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === "OPEN" ? "bg-green-500/10 text-green-400" : "bg-neutral-500/10 text-neutral-400"}`}>
          {d.status === "OPEN" ? "Abierta" : "Cerrada"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24 text-right",
      render: (d: CashDrawer) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); viewDetail(d); }}>
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
          </Button>
          {d.status === "OPEN" && (
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); openCloseModal(d); }}>
              <HugeiconsIcon icon={Money01Icon} strokeWidth={2} className="size-3.5 text-red-400" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title="Caja"
        subtitle="Control de apertura y cierre de caja"
        columns={columns}
        data={drawers}
        keyExtractor={(d) => d.id}
        loading={loading}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-36 h-9 text-sm"
            />
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-36 h-9 text-sm"
            />
            <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Empleado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="OPEN">Abierta</SelectItem>
                <SelectItem value="CLOSED">Cerrada</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { setPage(1); loadDrawers(filterEmployeeId, filterStatus, filterDateFrom, filterDateTo, 1, pageSize); }} disabled={loading}>
              Filtrar
            </Button>
            {(filterEmployeeId !== "ALL" || filterStatus !== "ALL" || filterDateFrom || filterDateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterEmployeeId("ALL"); setFilterStatus("ALL"); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); loadDrawers("ALL", "ALL", "", "", 1, pageSize); }} className="text-neutral-500 hover:text-red-400">
                Limpiar
              </Button>
            )}
            <Button onClick={() => setOpenModal(true)} className="h-9 px-4 text-sm font-semibold hover:bg-red-600">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 mr-1" />
              Abrir Caja
            </Button>
          </div>
        }
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => { setPage(p); loadDrawers(filterEmployeeId, filterStatus, filterDateFrom, filterDateTo, p, pageSize); }}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); loadDrawers(filterEmployeeId, filterStatus, filterDateFrom, filterDateTo, 1, s); }}
        showTotal={true}
        totalLabel={`${total} registros`}
      />

      {/* Modal abrir caja */}
      <GenericModal
        open={openModal}
        onOpenChange={setOpenModal}
        title="Abrir Caja"
        description="Ingrese el monto inicial en efectivo"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenModal(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleOpen} disabled={saving}>{saving ? "Abriendo..." : "Abrir Caja"}</Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="openAmount">Monto inicial</Label>
          <Input id="openAmount" type="number" min="0" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} placeholder="0" disabled={saving} />
        </div>
      </GenericModal>

      {/* Modal cerrar caja con reporte */}
      <GenericModal
        open={closeModal}
        onOpenChange={setCloseModal}
        title="Cerrar Caja"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCloseModal(false)} disabled={saving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClose} disabled={saving}>{saving ? "Cerrando..." : "Confirmar Cierre"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {closeReport && (
            <>
              {/* Resumen */}
              <div className="space-y-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Efectivo inicial</span>
                  <span className="text-neutral-900 dark:text-white tabular-nums font-medium">${fmt(closingDrawer?.openAmount || 0)}</span>
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 space-y-1">
                  <p className="text-xs font-semibold text-neutral-500 uppercase">Ventas por método</p>
                  {closeReport.byMethod.map((m) => (
                    <div key={m.name} className="flex justify-between text-sm">
                      <span className="text-neutral-500">{m.name}</span>
                      <span className="text-neutral-900 dark:text-white tabular-nums">${fmt(m.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-500">Total ventas</span>
                    <span className="text-green-600 dark:text-green-400 tabular-nums">${fmt(closeReport.salesTotal)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-neutral-200 dark:border-neutral-800 pt-2">
                  <span className="text-neutral-700 dark:text-neutral-300">Efectivo esperado en caja</span>
                  <span className="text-red-600 dark:text-red-400 tabular-nums">${fmt(closeReport.expectedCash)}</span>
                </div>
              </div>

              {/* Monto real */}
              <div className="space-y-2">
                <Label htmlFor="closeAmount">Efectivo contado</Label>
                <Input
                  id="closeAmount"
                  type="number"
                  min="0"
                  value={closeAmount}
                  onChange={(e) => setCloseAmount(e.target.value)}
                  placeholder="0"
                  disabled={saving}
                />
              </div>

              {/* Diferencia */}
              {closeAmount && (() => {
                const diff = parseFloat(closeAmount) - closeReport.expectedCash;
                if (Math.abs(diff) < 1) return null;
                return (
                  <div className={`flex justify-between text-sm font-semibold px-3 py-2 rounded-lg ${
                    diff < 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                  }`}>
                    <span>{diff < 0 ? "Faltante" : "Sobrante"}</span>
                    <span className="tabular-nums">${fmt(Math.abs(diff))}</span>
                  </div>
                );
              })()}

              {/* Observación condicional */}
              {closeAmount && Math.abs(parseFloat(closeAmount) - closeReport.expectedCash) >= 1 && (
                <div className="space-y-2">
                  <Label htmlFor="closeNote">Observación <span className="text-red-500">*</span></Label>
                  <Input
                    id="closeNote"
                    value={closeNote}
                    onChange={(e) => setCloseNote(e.target.value)}
                    placeholder="Explicá la diferencia..."
                    disabled={saving}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </GenericModal>

      {/* Modal detalle */}
      <GenericModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Detalle de Caja"
        description={selectedDrawer ? new Date(selectedDrawer.openDate).toLocaleString("es-AR") : ""}
        size="xl"
        footer={
          <div className="flex gap-2">
            {selectedDrawer?.status === "OPEN" && (
              <Button onClick={() => setTxModal(true)} disabled={saving}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                Transacción
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
          </div>
        }
      >
        {selectedDrawer && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Efectivo inicial</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">${fmt(selectedDrawer.openAmount)}</p>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Cierre</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">
                  {selectedDrawer.closeAmount != null ? `$${fmt(selectedDrawer.closeAmount)}` : "—"}
                </p>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Ventas</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{selectedDrawer.sales?.length || 0}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Ventas</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {selectedDrawer.sales?.length === 0 && <p className="text-sm text-neutral-400">Sin ventas</p>}
                {selectedDrawer.sales?.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-1.5 px-2 rounded text-sm border-b border-neutral-200 dark:border-neutral-800/50">
                    <span className="text-neutral-600 dark:text-neutral-400 font-mono w-12">#{sale.receiptNumber}</span>
                    <div className="flex gap-2 flex-1 flex-wrap">
                      {sale.salePayments?.map((sp, i) => (
                        <span key={i} className="text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded">
                          {sp.paymentMethod.name}: ${fmt(sp.amount)}
                        </span>
                      ))}
                    </div>
                    <span className="text-neutral-900 dark:text-white font-bold tabular-nums ml-2">${fmt(sale.total)}</span>
                  </div>
                ))}
              </div>
              {selectedDrawer.sales && selectedDrawer.sales.length > 0 && (() => {
                const totals: Record<string, number> = {};
                selectedDrawer.sales!.forEach(sale =>
                  sale.salePayments?.forEach(sp => {
                    totals[sp.paymentMethod.name] = (totals[sp.paymentMethod.name] || 0) + sp.amount;
                  })
                );
                return (
                  <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
                    {Object.entries(totals).map(([name, amount]) => (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Total {name}</span>
                        <span className="text-neutral-900 dark:text-white tabular-nums font-medium">${fmt(amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="text-neutral-700 dark:text-neutral-300">Total ventas</span>
                      <span className="text-green-600 dark:text-green-400 tabular-nums">${fmt(selectedDrawer.sales!.reduce((s, sale) => s + sale.total, 0))}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Transacciones</h3>
              <div className="space-y-1">
                {selectedDrawer.transactions?.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-1.5 px-2 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${TX_TYPE_STYLES[tx.type] || "bg-neutral-100 dark:bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"}`}>
                        {TX_TYPE_LABELS[tx.type] || tx.type}
                      </span>
                      <span className="text-neutral-600 dark:text-neutral-400">{tx.description || ""}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500 dark:text-neutral-500 text-xs tabular-nums">
                        {new Date(tx.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`font-medium tabular-nums ${["EXPENSE", "WITHDRAWAL"].includes(tx.type) ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        {["EXPENSE", "WITHDRAWAL"].includes(tx.type) ? "-" : "+"}${fmt(tx.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </GenericModal>

      {/* Modal transacción */}
      <GenericModal
        open={txModal}
        onOpenChange={setTxModal}
        title="Registrar Transacción"
        description="Agregue un gasto, retiro o depósito"
        footer={
          <>
            <Button variant="outline" onClick={() => setTxModal(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleAddTransaction} disabled={saving}>{saving ? "Guardando..." : "Registrar"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={txType} onValueChange={setTxType}>
              <SelectTrigger className="border-2 border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Gasto</SelectItem>
                <SelectItem value="WITHDRAWAL">Retiro</SelectItem>
                <SelectItem value="DEPOSIT">Depósito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="txAmount">Monto</Label>
            <Input id="txAmount" type="number" min="0" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="0" disabled={saving} className="border-2 border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="txDescription">Descripción</Label>
            <Input id="txDescription" value={txDescription} onChange={(e) => setTxDescription(e.target.value)} placeholder="Descripción opcional" disabled={saving} className="border-2 border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
          </div>
        </div>
      </GenericModal>
    </div>
  );
}
