"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, POSProduct } from "@/stores/cart.store";
import { productClientService } from "@/services/product.service";
import { clientErrorHandler } from "@/utils/handlers/clientHandler";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface ProductData {
  id: string;
  name: string;
  barcode: string | null;
  description: string | null;
  price: number;
  stock: { quantity: number } | null;
  category: { name: string };
}

export default function CatalogPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<POSProduct[]>([]);
  const [filtered, setFiltered] = useState<POSProduct[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);
  const [qtyInput, setQtyInput] = useState("1");
  const [qtyModalOpen, setQtyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const { items, addItem, updateQty, allProducts: catalogProducts } = useCartStore();

  useEffect(() => {
    if (catalogProducts.length > 0) {
      setAllProducts(catalogProducts);
      setFiltered(catalogProducts);
      setLoading(false);
    }
  }, [catalogProducts]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(allProducts);
    } else {
      const q = search.toLowerCase();
      setFiltered(allProducts.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      ));
    }
    setSelectedIndex(0);
  }, [search, allProducts]);

  const handleSelectProduct = (product: POSProduct) => {
    if (product.stock <= 0) { toast.error("Sin stock"); return; }
    setSelectedProduct(product);
    setQtyInput("1");
    setQtyModalOpen(true);
    setTimeout(() => qtyRef.current?.select(), 100);
  };

  const confirmAdd = useCallback(
    (product: POSProduct, qty: number) => {
      const existing = items.find((i) => i.productId === product.id);
      const currentQty = existing?.quantity || 0;
      if (currentQty + qty > product.stock) {
        toast.error(`Stock insuficiente (disponible: ${product.stock - currentQty})`);
        return;
      }
      const cartItem = {
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        quantity: qty,
        stock: product.stock,
      };
      existing ? updateQty(product.id, currentQty + qty) : addItem(cartItem);
      setQtyModalOpen(false);
      toast.success(`${product.name} agregado`);
      setTimeout(() => searchRef.current?.focus(), 0);
    },
    [items, addItem, updateQty],
  );

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !qtyModalOpen) {
        router.push("/pos");
      }
    };
    document.addEventListener("keyup", onKeyUp);
    return () => document.removeEventListener("keyup", onKeyUp);
  }, [qtyModalOpen, router]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((p) => Math.min(p + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((p) => Math.max(p - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[selectedIndex]) handleSelectProduct(filtered[selectedIndex]); }
  };

  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

return (
    <div className="flex flex-col gap-3 h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pos")} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white shrink-0">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
        </Button>
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar en catálogo..."
            className="h-14 text-xl pl-12 pr-32 bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            autoFocus
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500 dark:text-neutral-600 select-none">
            <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500">Esc</kbd> volver
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-3 text-neutral-400 dark:text-neutral-400">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-neutral-400 dark:text-neutral-500">Sin resultados</p>
        ) : (
          filtered.map((product, index) => (
            <button
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              className={`w-full flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/60 transition-colors text-left
                ${index === selectedIndex ? "bg-red-50 dark:bg-red-600/15 border-l-2 border-l-red-500" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60"}
                ${product.stock <= 0 ? "opacity-40" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-neutral-900 dark:text-white text-base font-semibold truncate">{product.name}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">{product.barcode || "Sin código"}</p>
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-neutral-900 dark:text-white font-bold text-base">${fmt(product.price)}</p>
                <p className={`text-sm ${product.stock <= 5 ? "text-red-600 dark:text-red-400" : "text-neutral-500"}`}>{product.stock} en stock</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Modal cantidad */}
      <GenericModal
        open={qtyModalOpen}
        onOpenChange={(open) => { setQtyModalOpen(open); if (!open) setTimeout(() => searchRef.current?.focus(), 0); }}
        title="Agregar producto"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setQtyModalOpen(false)} className="h-11 px-6 text-base">Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 h-11 px-6 text-base" onClick={() => selectedProduct && confirmAdd(selectedProduct, parseInt(qtyInput) || 1)}>
              Agregar ↵
            </Button>
          </>
        }
      >
        {selectedProduct && (() => {
          const inCart = items.find(i => i.productId === selectedProduct.id)?.quantity || 0;
          const available = selectedProduct.stock - inCart;
          const qty = parseInt(qtyInput) || 1;
          const overStock = qty > available;
          return (
            <div className="space-y-4">
              <div>
                <p className="text-neutral-900 dark:text-white text-2xl font-black leading-tight">{selectedProduct.name}</p>
                <p className="text-red-600 dark:text-red-400 text-3xl font-black tabular-nums mt-1">${fmt(selectedProduct.price)}</p>
                <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1">
                  Disponible: <span className={available <= 0 ? "text-red-600 dark:text-red-400" : available <= 5 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}>{available}</span>
                  {inCart > 0 && <span className="text-neutral-400 dark:text-neutral-600 ml-1">({inCart} ya en carrito)</span>}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Label className="text-neutral-600 dark:text-neutral-400 shrink-0">Cantidad</Label>
                  <Input
                    ref={qtyRef}
                    type="number"
                    min="1"
                    max={available}
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); confirmAdd(selectedProduct, parseInt(qtyInput) || 1); }
                      if (e.key === "Escape") setQtyModalOpen(false);
                    }}
                    className={`text-xl text-center h-12 font-bold ${overStock ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                </div>
                {overStock && (
                  <p className="text-red-600 dark:text-red-400 text-sm">Stock insuficiente — máximo {available}</p>
                )}
              </div>
            </div>
          );
        })()}
      </GenericModal>
    </div>
  );
}
