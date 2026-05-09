"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { productClientService } from "@/services/product.service";
import { stockClientService } from "@/services/stock.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { useAlertStore } from "@/stores/alert.store";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  price: number;
  stock: { quantity: number; minStock: number; maxStock: number | null } | null;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [adjustType, setAdjustType] = useState<"ADJUSTMENT_IN" | "ADJUSTMENT_OUT">("ADJUSTMENT_IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initialLoadDone = useRef<boolean | null>(null);

  const loadProducts = useCallback(async (s?: string, p?: number, ps?: number) => {
    setLoading(true);
    try {
      const result = await productClientService.findAll({ search: s, page: p, limit: ps });
      setProducts(result.items || result);
      setTotal(result.total || 0);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadDone.current == null) {
      initialLoadDone.current = true;
      loadProducts(undefined, 1, 10);
    }
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [loadProducts]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => loadProducts(v, 1, pageSize), 300);
  };

  const openAdjust = (product: Product) => {
    setSelectedProduct(product.id);
    setQuantity("");
    setReason("");
    setAdjustType("ADJUSTMENT_IN");
    setQuantityError("");
    setReasonError("");
    setAdjustOpen(true);
  };

  const handleAdjust = async () => {
    let valid = true;
    if (!quantity || parseInt(quantity) < 1) { setQuantityError("Ingresá una cantidad válida"); valid = false; } else setQuantityError("");
    if (!reason.trim()) { setReasonError("El motivo es obligatorio"); valid = false; } else setReasonError("");
    if (!valid) return;

    setAdjusting(true);
    try {
      await stockClientService.adjust({
        productId: selectedProduct,
        type: adjustType,
        quantity: parseInt(quantity),
        reason: reason.trim(),
      });
      clientSuccessHandler("Stock ajustado correctamente");
      setAdjustOpen(false);
      setReason("");
      setQuantity("");
      setQuantityError("");
      setReasonError("");
      setSelectedProduct("");
      loadProducts(search, page, pageSize);
      
      // Recargar alertas después de ajustar stock
      useAlertStore.getState().loadAlerts();
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setAdjusting(false);
    }
  };

const stockBadge = (p: Product) => {
    const qty = p.stock?.quantity ?? 0;
    const min = p.stock?.minStock ?? 5;
    if (qty === 0)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3" />
          0
        </span>
      );
    if (qty <= min)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3" />
          {qty}
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">
        {qty}
      </span>
    );
  };

  const columns = [
    {
      key: "barcode",
      label: "Código",
      className: "w-32",
      hideOnMobile: true,
      render: (p: Product) => (
        <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400">{p.barcode || "—"}</span>
      ),
    },
    {
      key: "name",
      label: "Producto",
      render: (p: Product) => <span className="text-neutral-900 dark:text-white font-medium">{p.name}</span>,
    },
    {
      key: "price",
      label: "Precio",
      className: "w-28 text-right",
      hideOnMobile: true,
      render: (p: Product) => (
        <span className="text-neutral-900 dark:text-white tabular-nums">
          ${p.price.toLocaleString("es-AR")}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "Stock",
      className: "w-24 text-center",
      render: (p: Product) => stockBadge(p),
    },
    {
      key: "minStock",
      label: "Mínimo",
      className: "w-20 text-center",
      render: (p: Product) => (
        <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">{p.stock?.minStock ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-16 text-right",
      render: (p: Product) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openAdjust(p); }} className="text-neutral-500 hover:text-green-400 h-9 w-9 md:h-8 md:w-8">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Stock"
        subtitle="Inventario actual y alertas de stock bajo"
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        loading={loading}
        searchPlaceholder="Buscar producto..."
        onSearch={handleSearch}
        actions={
          <></>
        }
        totalLabel={`${total} productos`}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: (p) => { setPage(p); loadProducts(search, p, pageSize); },
          onPageSizeChange: (s) => { setPageSize(s); setPage(1); loadProducts(search, 1, s); },
        }}
      />

      <GenericModal
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        title="Ajustar Stock"
        description={products.find(p => p.id === selectedProduct)?.name || ""}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjustOpen(false)} disabled={adjusting}>
              Cancelar
            </Button>
            <Button onClick={handleAdjust} disabled={adjusting}>
              {adjusting ? "Aplicando..." : "Aplicar Ajuste"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de ajuste</Label>
            <Select
              value={adjustType}
              onValueChange={(v) =>
                setAdjustType(v as "ADJUSTMENT_IN" | "ADJUSTMENT_OUT")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADJUSTMENT_IN">Entrada (+)</SelectItem>
                <SelectItem value="ADJUSTMENT_OUT">Salida (−)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-qty">
              Cantidad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adj-qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setQuantityError(""); }}
              placeholder="0"
              disabled={adjusting}
              className={quantityError ? "border-red-500" : ""}
            />
            {quantityError && <p className="text-red-400 text-sm">{quantityError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-reason">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adj-reason"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
              placeholder="Ej: Reconteo, Merma, Devolución..."
              disabled={adjusting}
              className={reasonError ? "border-red-500" : ""}
            />
            {reasonError && <p className="text-red-400 text-sm">{reasonError}</p>}
          </div>
        </div>
      </GenericModal>
    </>
  );
}