"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DataTable } from "@/components/common/DataTable";
import { GenericModal } from "@/components/common/GenericModal";
import { Pagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { purchaseClientService } from "@/services/purchase.service";
import { supplierClientService } from "@/services/supplier.service";
import { productClientService } from "@/services/product.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { useAlertStore } from "@/stores/alert.store";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ViewIcon, Delete02Icon } from "@hugeicons/core-free-icons";

interface PurchaseItem {
  product: { name: string };
  quantity: number;
  costPrice: number;
}

interface Purchase {
  id: string;
  total: number;
  createdAt: string;
  supplier: { name: string };
  items: PurchaseItem[];
}

interface Supplier { id: string; name: string; }
interface Product { id: string; name: string; costPrice: number; }

interface PurchaseFormItem {
  productId: string;
  productName: string;
  quantity: string;
  costPrice: string;
}

// Buscador genérico con dropdown
function SearchInput({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (id: string, label: string) => void;
  options: { id: string; label: string; sub?: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {open && value && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-48 overflow-y-auto shadow-xl">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={() => { onSelect(o.id, o.label); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0"
            >
              {o.label}
              {o.sub && <span className="text-xs text-neutral-400 ml-2">{o.sub}</span>}
            </button>
          ))}
        </div>
      )}
      {open && value && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl">
          <p className="px-3 py-2 text-sm text-neutral-500">Sin resultados</p>
        </div>
      )}
    </div>
  );
}

const QUICK_RANGES = [
  { label: "Hoy", getDates: () => { const d = new Date(); d.setHours(0,0,0,0); return { from: d, to: d }; } },
  { label: "Ayer", getDates: () => { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); return { from: d, to: d }; } },
  { label: "Semana", getDates: () => { const d = new Date(); const day = d.getDay(); const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); mon.setHours(0,0,0,0); return { from: mon, to: new Date() }; } },
  { label: "Mes", getDates: () => { const d = new Date(); return { from: new Date(d.getFullYear(), d.getMonth(), 1), to: new Date() }; } },
];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);

  // Filtros
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSupplierId, setFilterSupplierId] = useState("");
  const [filterSupplierName, setFilterSupplierName] = useState("");
  const [activeQuick, setActiveQuick] = useState("");

  // Form nueva compra
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [formItems, setFormItems] = useState<PurchaseFormItem[]>([
    { productId: "", productName: "", quantity: "1", costPrice: "0" },
  ]);

  const loadPurchases = useCallback(async (supId?: string, dateFrom?: string, dateTo?: string, p?: number, ps?: number) => {
    setLoading(true);
    try {
      const result = await purchaseClientService.findAll({
        page: p || page,
        limit: ps || pageSize,
        supplierId: supId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPurchases(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadPurchases();
    supplierClientService.findAllActive()
      .then((d) => setSuppliers(Array.isArray(d) ? d : d.items || []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setFormItems([{ productId: "", productName: "", quantity: "1", costPrice: "0" }]);
    setSupplierSearch("");
    setSupplierId("");
    setModalOpen(true);
  };

  const addFormItem = () => {
    setFormItems([...formItems, { productId: "", productName: "", quantity: "1", costPrice: "0" }]);
  };

  const removeFormItem = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateFormItem = (index: number, field: keyof PurchaseFormItem, value: string) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const selectProduct = (index: number, id: string, name: string) => {
    const product = productSearchResults.find((p) => p.id === id);
    
    // Verificar si el producto ya existe en otra línea
    const existingIndex = formItems.findIndex((item, i) => i !== index && item.productId === id);
    
    if (existingIndex !== -1) {
      // Si existe, incrementar cantidad y limpiar la línea actual
      const updated = [...formItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: String(parseInt(updated[existingIndex].quantity || "1") + parseInt(updated[index].quantity || "1")),
      };
      // Limpiar la línea actual
      updated[index] = {
        productId: "",
        productName: "",
        quantity: "1",
        costPrice: "0",
      };
      setFormItems(updated);
      toast.info(`Cantidad actualizada en línea ${existingIndex + 1}`);
    } else {
      // Si no existe, asignar normalmente
      const updated = [...formItems];
      updated[index] = {
        ...updated[index],
        productId: id,
        productName: name,
        costPrice: product ? String(product.costPrice) : "0",
      };
      setFormItems(updated);
    }
  };

  const handleSubmit = async () => {
    if (!supplierId) { toast.error("Seleccione un proveedor"); return; }
    const validItems = formItems.filter((i) => i.productId && parseInt(i.quantity) > 0);
    if (validItems.length === 0) { toast.error("Agregue al menos un producto"); return; }
    setSaving(true);
    try {
      await purchaseClientService.create({
        supplierId,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: parseInt(i.quantity),
          costPrice: parseFloat(i.costPrice) || 0,
        })),
      });
      clientSuccessHandler("Compra registrada correctamente");
      setModalOpen(false);
      loadPurchases(filterSupplierId, filterDateFrom, filterDateTo, page, pageSize);
      
      // Recargar alertas después de registrar compra
      useAlertStore.getState().loadAlerts();
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setSaving(false);
    }
  };

  const handleFilter = () => { setPage(1); loadPurchases(filterSupplierId, filterDateFrom, filterDateTo, 1, pageSize); };

  const handleClearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSupplierId("");
    setFilterSupplierName("");
    setActiveQuick("");
    setPage(1);
    loadPurchases("", "", "", 1, pageSize);
  };

  const hasFilters = filterDateFrom || filterDateTo || filterSupplierId;
  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

  const columns = [
    {
      key: "createdAt",
      label: "Fecha",
      className: "w-40",
      render: (p: Purchase) => (
        <span className="text-neutral-600 dark:text-neutral-300 text-sm tabular-nums">
          {new Date(p.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "supplier",
      label: "Proveedor",
      className: "w-36",
      render: (p: Purchase) => <span className="text-neutral-900 dark:text-neutral-300">{p.supplier?.name || "—"}</span>,
    },
    {
      key: "items",
      label: "Productos",
      hideOnMobile: true,
      render: (p: Purchase) => (
        <div className="space-y-0.5">
          {p.items?.map((item, i) => (
            <p key={i} className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="text-neutral-900 dark:text-white font-medium">{item.product?.name || "—"}</span>
              <span className="ml-1 text-neutral-500">x{item.quantity}</span>
            </p>
          ))}
        </div>
      ),
    },
    {
      key: "total",
      label: "Total",
      className: "w-28 text-right",
      render: (p: Purchase) => <span className="text-neutral-900 dark:text-white font-medium tabular-nums">${fmt(p.total)}</span>,
    },
    {
      key: "actions",
      label: "",
      className: "w-12 text-right",
      render: (p: Purchase) => (
        <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSelectedPurchase(p); setDetailOpen(true); }}>
          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title="Compras"
        subtitle="Registro de compras a proveedores"
        columns={columns}
        data={purchases}
        keyExtractor={(p) => p.id}
        loading={loading}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 mr-2">
              {QUICK_RANGES.map((r) => (
                <Button
                  key={r.label}
                  variant={activeQuick === r.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const { from, to } = r.getDates();
                    const fromStr = from.toISOString().split("T")[0];
                    const toStr = to.toISOString().split("T")[0];
                    setFilterDateFrom(fromStr);
                    setFilterDateTo(toStr);
                    setActiveQuick(r.label);
                    setPage(1);
                    loadPurchases(filterSupplierId, fromStr, toStr, 1, pageSize);
                  }}
                  className="h-9 text-sm"
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <Input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setActiveQuick(""); }} className="w-36 h-9 text-sm" />
            <Input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setActiveQuick(""); }} className="w-36 h-9 text-sm" />
            <div className="w-44">
              <SearchInput
                value={filterSupplierName}
                onChange={(v) => { setFilterSupplierName(v); if (!v) setFilterSupplierId(""); }}
                onSelect={(id, label) => { setFilterSupplierId(id); setFilterSupplierName(label); }}
                options={suppliers.map((s) => ({ id: s.id, label: s.name }))}
                placeholder="Proveedor..."
              />
            </div>
            <Button size="sm" onClick={handleFilter} disabled={loading}>Filtrar</Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-neutral-500 hover:text-red-400">Limpiar</Button>
            )}
            <Button onClick={openCreate} className="h-9 px-4 text-sm font-semibold hover:bg-red-600">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 mr-1" />
              Nueva Compra
            </Button>
          </div>
        }
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => { setPage(p); loadPurchases(filterSupplierId, filterDateFrom, filterDateTo, p, pageSize); }}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); loadPurchases(filterSupplierId, filterDateFrom, filterDateTo, 1, s); }}
        showTotal={true}
        totalLabel={`${total} compras`}
      />

      {/* Modal nueva compra */}
      <GenericModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Nueva Compra"
        description="El stock se actualizará automáticamente."
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Registrando..." : "Registrar Compra"}</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Proveedor */}
          <div className="space-y-2">
            <Label>Proveedor <span className="text-red-500">*</span></Label>
            <SearchInput
              value={supplierSearch}
              onChange={(v) => { setSupplierSearch(v); if (!v) setSupplierId(""); }}
              onSelect={(id, label) => { setSupplierId(id); setSupplierSearch(label); }}
              options={suppliers.map((s) => ({ id: s.id, label: s.name }))}
              placeholder="Buscar proveedor..."
              disabled={saving}
            />
            {supplierId && <p className="text-xs text-green-500">✓ Proveedor seleccionado</p>}
          </div>

          {/* Productos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Productos</Label>
              <Button variant="ghost" size="sm" onClick={addFormItem} disabled={saving}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 mr-1" />
                Agregar línea
              </Button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-neutral-500 px-1">
              <span className="col-span-5">Producto</span>
              <span className="col-span-2">Cant.</span>
              <span className="col-span-3">Costo unit.</span>
              <span className="col-span-2"></span>
            </div>

            {formItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <SearchInput
                    value={item.productName}
                    onChange={(v) => {
                      updateFormItem(i, "productName", v);
                      if (v.length >= 2) {
                        fetch(`/api/products/search?q=${encodeURIComponent(v)}`)
                          .then(r => r.json())
                          .then(setProductSearchResults)
                          .catch(() => {});
                      }
                    }}
                    onSelect={(id, label) => selectProduct(i, id, label)}
                    options={productSearchResults.map((p) => ({ id: p.id, label: p.name, sub: `$${fmt(p.costPrice)}` }))}
                    placeholder="Buscar producto..."
                    disabled={saving}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateFormItem(i, "quantity", e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.costPrice}
                    onChange={(e) => updateFormItem(i, "costPrice", e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFormItem(i)}
                    disabled={saving || formItems.length <= 1}
                    className="text-red-400 hover:text-red-300"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-sm text-neutral-500 mr-2">Total:</span>
              <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
                ${fmt(formItems.reduce((s, i) => s + (parseFloat(i.costPrice) || 0) * (parseInt(i.quantity) || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </GenericModal>

      {/* Modal detalle */}
      <GenericModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Detalle de Compra"
        description={selectedPurchase ? new Date(selectedPurchase.createdAt).toLocaleString("es-AR") : ""}
        footer={<Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>}
      >
        {selectedPurchase && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500">Proveedor</p>
              <p className="text-neutral-900 dark:text-white font-medium">{selectedPurchase.supplier?.name || "—"}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase">Productos</h3>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {selectedPurchase.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {item.product?.name || "—"} <span className="text-neutral-500">x{item.quantity}</span>
                    </span>
                    <span className="text-neutral-900 dark:text-white tabular-nums">${fmt(item.costPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 flex justify-between font-bold text-lg">
              <span className="text-neutral-900 dark:text-white">Total</span>
              <span className="text-red-500 tabular-nums">${fmt(selectedPurchase.total)}</span>
            </div>
          </div>
        )}
      </GenericModal>
    </div>
  );
}
