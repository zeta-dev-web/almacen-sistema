"use client";

import { useState, useCallback, useRef } from "react";
import { DataTable } from "@/components/common/DataTable";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { stockClientService } from "@/services/stock.service";
import { clientErrorHandler } from "@/utils/handlers/clientHandler";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon } from "@hugeicons/core-free-icons";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  SALE: { label: "Venta", color: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  PURCHASE: { label: "Compra", color: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" },
  ADJUSTMENT_IN: { label: "Ajuste (+)", color: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  ADJUSTMENT_OUT: { label: "Ajuste (−)", color: "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  RETURN: { label: "Devolución", color: "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  OPENING: { label: "Apertura", color: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400" },
};

interface Movement {
  id: string;
  type: string;
  quantity: number;
  description: string | null;
  createdAt: string;
  product: { name: string; barcode: string | null };
  createdBy: { name: string };
}

interface StockMovementsData {
  items: Movement[];
  total: number;
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const initialLoadDone = useRef<boolean | null>(null);

  const loadMovements = useCallback(async (p?: number, ps?: number) => {
    setLoading(true);
    try {
      const result = await stockClientService.getMovements({ page: p, limit: ps });
      const data = result as StockMovementsData;
      setMovements(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (initialLoadDone.current == null) {
    initialLoadDone.current = true;
    loadMovements(1, 10);
  }

  const openDetail = (m: Movement) => {
    setSelectedMovement(m);
    setDetailOpen(true);
  };

  const columns = [
    {
      key: "createdAt",
      label: "Fecha",
      className: "w-48",
      render: (m: Movement) => (
        <span className="text-neutral-600 dark:text-neutral-300 text-sm tabular-nums">
          {new Date(m.createdAt).toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "type",
      label: "Tipo",
      className: "w-32",
      render: (m: Movement) => {
        const t = TYPE_LABELS[m.type] || { label: m.type, color: "bg-neutral-100 dark:bg-neutral-500/10 text-neutral-700 dark:text-neutral-400" };
        return (
          <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${t.color}`}>
            {t.label}
          </span>
        );
      },
    },
    {
      key: "product",
      label: "Producto",
      render: (m: Movement) => (
        <div>
          <span className="text-neutral-900 dark:text-white">{m.product.name}</span>
          {m.product.barcode && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 font-mono">{m.product.barcode}</p>
          )}
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Cant.",
      className: "w-20 text-right",
      render: (m: Movement) => {
        const isIn = ["ADJUSTMENT_IN", "PURCHASE", "RETURN", "OPENING"].includes(m.type);
        return (
          <span className={`tabular-nums font-medium text-sm ${isIn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isIn ? "+" : "−"}{m.quantity}
          </span>
        );
      },
    },
    {
      key: "description",
      label: "Motivo",
      className: "w-28",
      hideOnMobile: true,
      render: (m: Movement) => (
        <span className="text-neutral-500 dark:text-neutral-400 text-sm">{m.description || "—"}</span>
      ),
    },
    {
      key: "createdBy",
      label: "Usuario",
      className: "w-28",
      hideOnMobile: true,
      render: (m: Movement) => (
        <span className="text-neutral-600 dark:text-neutral-300">{m.createdBy.name}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-16 text-right",
      render: (m: Movement) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(m);
          }}
          className="h-9 w-9 md:h-8 md:w-8 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Movimientos"
        subtitle="Historial de cambios de stock"
        columns={columns}
        data={movements}
        keyExtractor={(m) => m.id}
        loading={loading}
        totalLabel={`${total} movimientos`}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: (p) => { setPage(p); loadMovements(p, pageSize); },
          onPageSizeChange: (s) => { setPageSize(s); setPage(1); loadMovements(1, s); },
        }}
      />

      <GenericModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Detalle del Movimiento"
        size="md"
        footer={
          <Button variant="outline" onClick={() => setDetailOpen(false)}>
            Cerrar
          </Button>
        }
      >
        {selectedMovement && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Fecha</p>
                <p className="text-base font-medium text-neutral-900 dark:text-white">
                  {new Date(selectedMovement.createdAt).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Tipo</p>
                <p className="text-base font-medium text-neutral-900 dark:text-white">
                  {TYPE_LABELS[selectedMovement.type]?.label || selectedMovement.type}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Producto</p>
              <p className="text-base font-medium text-neutral-900 dark:text-white">
                {selectedMovement.product.name}
              </p>
              {selectedMovement.product.barcode && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 font-mono">
                  {selectedMovement.product.barcode}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Cantidad</p>
                <p className="text-2xl font-bold tabular-nums">
                  {["ADJUSTMENT_IN", "PURCHASE", "RETURN", "OPENING"].includes(selectedMovement.type)
                    ? <span className="text-green-600 dark:text-green-400">+{selectedMovement.quantity}</span>
                    : <span className="text-red-600 dark:text-red-400">−{selectedMovement.quantity}</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Usuario</p>
                <p className="text-base font-medium text-neutral-900 dark:text-white">
                  {selectedMovement.createdBy.name}
                </p>
              </div>
            </div>

            {selectedMovement.description && (
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Motivo</p>
                <p className="text-base text-neutral-900 dark:text-white">
                  {selectedMovement.description}
                </p>
              </div>
            )}
          </div>
        )}
      </GenericModal>
    </>
  );
}