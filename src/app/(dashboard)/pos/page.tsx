"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, CartItem, POSProduct } from "@/stores/cart.store";
import { useAlertStore } from "@/stores/alert.store";
import { productClientService } from "@/services/product.service";
import { saleClientService } from "@/services/sale.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { GenericModal, ConfirmModal } from "@/components/common/GenericModal";
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
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  MinusSignIcon,
  PlusSignIcon,
  PrinterIcon,
  Cancel01Icon,
  CoinsIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface ProductData {
  id: string;
  name: string;
  barcode: string | null;
  price: number;
  stock: { quantity: number } | null;
  category: { name: string };
}

export default function POSPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [qtyInput, setQtyInput] = useState("1");
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);
  const [qtyModalOpen, setQtyModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{
    receiptNumber: number;
    total: number;
    createdAt: string;
    saleItems: { product: { name: string }; quantity: number; subtotal: number }[];
    salePayments: { paymentMethod: { name: string }; amount: number }[];
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [newPaymentMethodId, setNewPaymentMethodId] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  const {
    items,
    payments,
    allProducts,
    loadCatalog,
    search,
    updateLocalStock,
    addItem,
    updateQty,
    incrementQty,
    decrementQty,
    removeItem,
    clearCart,
    addPayment,
    removePayment,
    clearPayments,
    getTotal,
    getTotalPaid,
    getRemaining,
    setDiscount,
    clearDiscount,
    discount,
    discountType,
    restoreCart,
  } = useCartStore();

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products/pos");
      const products = await response.json();
      
      // Ordenar por nombre para búsqueda más eficiente
      const sorted = products.sort((a: POSProduct, b: POSProduct) => 
        a.name.localeCompare(b.name, "es")
      );
      
      loadCatalog(sorted);
    } catch (error) {
      clientErrorHandler(error);
    }
  }, [loadCatalog]);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/payment-methods");
      const data = await res.json();
      const active = data.filter((pm: PaymentMethod) => pm.isActive);
      setPaymentMethods(active);
      const efectivo = active.find((pm: PaymentMethod) => pm.name.toLowerCase() === "efectivo");
      if (efectivo) setNewPaymentMethodId(efectivo.id);
    } catch {}
  }, []);

  useEffect(() => {
    loadProducts();
    loadPaymentMethods();
    if (items.length === 0) {
      const hasDraft = restoreCart();
      if (hasDraft) setRecoverOpen(true);
    }

    const interval = setInterval(() => {
      loadProducts();
    }, parseInt(process.env.NEXT_PUBLIC_POS_REFRESH_INTERVAL || "600000", 10));

    return () => {
      clearInterval(interval);
    };
  }, [loadProducts, loadPaymentMethods]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        handleCheckout();
      }
      if (e.key === "Enter" && ticketOpen) {
        e.preventDefault();
        setTicketOpen(false);
      }
      if (e.key === "F9") {
        e.preventDefault();
        router.push("/pos/catalog");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [items, ticketOpen, router]);

  const [searchResults, setSearchResults] = useState<POSProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const focusSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(allProducts);
    setSelectedIndex(0);
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [allProducts]);

  useEffect(() => {
    setSearchResults(allProducts);
  }, [allProducts]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedIndex(0);
    
    if (!query.trim()) {
      setSearchResults(allProducts);
      return;
    }
    
    setIsSearching(true);
    const results = search(query);
    setSearchResults(results);
    setIsSearching(false);
  }, [allProducts, search]);

  const confirmAddProduct = useCallback(
    (product: POSProduct, qty: number) => {
      if (product.stock <= 0) { toast.error("Sin stock"); return; }
      const existing = items.find((i) => i.productId === product.id);
      const currentQty = existing?.quantity || 0;
      if (currentQty + qty > product.stock) {
        toast.error(`Stock insuficiente (disponible: ${product.stock - currentQty})`);
        return;
      }
      const cartItem: CartItem = {
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        quantity: qty,
        stock: product.stock,
      };
      existing ? updateQty(product.id, currentQty + qty) : addItem(cartItem);
      setQtyModalOpen(false);
      setSelectedProduct(null);
      focusSearch();
    },
    [items, addItem, updateQty, focusSearch],
  );

  const handleSelectProduct = (product: POSProduct) => {
    if (product.stock <= 0) { toast.error("Sin stock"); return; }
    setSelectedProduct(product);
    setQtyInput("1");
    setQtyModalOpen(true);
    setTimeout(() => qtyRef.current?.select(), 100);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[selectedIndex]) handleSelectProduct(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setSearchResults(allProducts);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) { toast.error("Agregue productos al carrito"); return; }
    clearPayments();
    const efectivo = paymentMethods.find((pm) => pm.name.toLowerCase() === "efectivo");
    if (efectivo) {
      addPayment({ paymentMethodId: efectivo.id, paymentMethodName: efectivo.name, amount: total });
      setNewPaymentMethodId(efectivo.id);
      setNewPaymentAmount("");
    }
    setCheckoutOpen(true);
    setTimeout(() => paymentAmountRef.current?.focus(), 100);
  };

  const handleAddPayment = () => {
    if (!newPaymentMethodId || !newPaymentAmount) { toast.error("Seleccione método y monto"); return; }
    const amount = parseFloat(newPaymentAmount);
    if (amount <= 0) { toast.error("Monto inválido"); return; }
    const pm = paymentMethods.find((p) => p.id === newPaymentMethodId);
    addPayment({ paymentMethodId: newPaymentMethodId, paymentMethodName: pm?.name || "", amount });
    setNewPaymentMethodId("");
    setNewPaymentAmount("");
  };

  const handleConfirmSale = async () => {
    const remaining = getRemaining();
    if (remaining > 0.01) {
      toast.error(`Falta pagar: $${remaining.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`);
      return;
    }
    setProcessing(true);
    try {
      const sale = await saleClientService.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price })),
        payments: payments.map((p) => ({ paymentMethodId: p.paymentMethodId, amount: p.amount })),
        discount,
        discountType,
      });
      setLastSale(sale);
      items.forEach((item) => {
        updateLocalStock(item.productId, -item.quantity);
      });
      setCheckoutOpen(false);
      setTicketOpen(true);
      clearCart();
      clearDiscount();
      clearPayments();
      const efectivo = paymentMethods.find((pm) => pm.name.toLowerCase() === "efectivo");
      if (efectivo) setNewPaymentMethodId(efectivo.id);
      setNewPaymentAmount("");
      clientSuccessHandler("Venta registrada");
      
      // Recargar alertas después de la venta
      useAlertStore.getState().loadAlerts();
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setProcessing(false);
    }
  };

  const total = getTotal();
  const totalPaid = getTotalPaid();
  const remaining = getRemaining();
  const change = totalPaid > total ? totalPaid - total : 0;
  const fmt = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-5rem)] pb-4 lg:pb-0">
      {/* Buscador superior ancho completo */}
      <div className="relative">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <Input
          ref={searchRef}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Buscar producto o escanear código de barras..."
          className="h-14 text-xl pl-12 pr-4 md:pr-40 bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          autoFocus
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-600 select-none">
          <span><kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500">F9</kbd> catálogo</span>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-500">F10</kbd> cobrar</span>
        </div>
      </div>

      {/* Resultados de búsqueda (solo si hay query) */}
      {searchQuery && (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 overflow-hidden max-h-80 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="p-6 text-center text-neutral-400 dark:text-neutral-500 text-lg">Sin resultados — presioná <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">F</kbd> para ver el catálogo</p>
          ) : (
            searchResults.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className={`w-full flex items-center justify-between px-3 md:px-4 py-3 md:py-4 border-b border-neutral-100 dark:border-neutral-800/60 transition-colors text-left
                  ${index === selectedIndex ? "bg-red-50 dark:bg-red-600/15 border-l-2 border-l-red-500" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60"}
                  ${product.stock <= 0 ? "opacity-40" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-neutral-900 dark:text-white text-base md:text-2xl font-bold truncate">{product.name}</p>
                  {product.barcode && <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-500 font-mono">{product.barcode}</p>}
                </div>
                <div className="text-right ml-3 md:ml-4 shrink-0">
                  <p className="text-neutral-900 dark:text-white font-bold text-base md:text-xl">${fmt(product.price)}</p>
                  <p className={`text-xs md:text-sm ${product.stock <= 5 ? "text-red-600 dark:text-red-400" : "text-neutral-500"}`}>{product.stock} en stock</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Carrito */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
        <div className="flex-1 flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-900 dark:text-white font-bold text-lg">
              Carrito <span className="text-neutral-500 dark:text-neutral-500 text-base font-normal">({items.length})</span>
            </span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-neutral-500 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 text-sm">Vaciar</Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-8 text-center text-neutral-400 dark:text-neutral-600 text-xl">Buscá un producto para agregarlo</p>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 px-3 py-3 border-b border-neutral-100 dark:border-neutral-800/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-900 dark:text-white font-bold text-sm md:text-xl truncate">{item.name}</p>
                    <p className="text-neutral-500 dark:text-neutral-500 text-xs md:text-base">${fmt(item.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon-xs" onClick={() => decrementQty(item.productId)}>
                      <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} className="size-3 md:size-4" />
                    </Button>
                    <span className="w-8 md:w-12 text-center text-sm md:text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{item.quantity}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => incrementQty(item.productId)} disabled={item.quantity >= item.stock}>
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3 md:size-4" />
                    </Button>
                  </div>
                  <span className="w-16 md:w-28 text-right text-sm md:text-xl font-bold text-neutral-900 dark:text-white tabular-nums shrink-0">${fmt(item.price * item.quantity)}</span>
                  <Button variant="ghost" size="icon-xs" onClick={() => removeItem(item.productId)} className="text-neutral-500 dark:text-neutral-600 hover:text-red-600 dark:hover:text-red-400 shrink-0">
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3 md:size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
          {/* Panel inferior: descuento + total + cobrar (desktop) */}
          <div className="hidden lg:flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 dark:text-neutral-500 text-sm shrink-0">Desc.</span>
                <Select value={discountType} onValueChange={(v) => setDiscount(discount, v as "percentage" | "fixed")}>
                  <SelectTrigger className="w-14 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">$</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min="0" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0, discountType)} className="h-8 text-sm w-24" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-neutral-500 dark:text-neutral-500 text-xs uppercase tracking-wider">Total</span>
                <span className="text-red-600 dark:text-red-500 text-3xl font-black tabular-nums">${fmt(total)}</span>
              </div>
            </div>
            <Button className="w-full h-12 text-lg font-bold bg-red-600 hover:bg-red-700" onClick={handleCheckout} disabled={items.length === 0}>
              <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-5 mr-2" />
              Cobrar · F10
            </Button>
          </div>
        </div>

        {/* Panel derecho/inferior: descuento + total + cobrar (mobile) */}
        <div className="lg:hidden flex flex-col gap-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 p-4">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 dark:text-neutral-500 text-sm shrink-0">Desc.</span>
            <Select value={discountType} onValueChange={(v) => setDiscount(discount, v as "percentage" | "fixed")}>
              <SelectTrigger className="w-14 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">%</SelectItem>
                <SelectItem value="fixed">$</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" min="0" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0, discountType)} className="h-8 text-sm flex-1" />
          </div>
          <div className="flex-1 lg:flex-initial flex flex-col items-center justify-center gap-1">
            <span className="text-neutral-500 dark:text-neutral-500 text-sm uppercase tracking-wider">Total</span>
            <span className="text-red-600 dark:text-red-500 text-4xl lg:text-5xl font-black tabular-nums">${fmt(total)}</span>
          </div>
          <Button className="w-full h-14 text-xl font-bold bg-red-600 hover:bg-red-700" onClick={handleCheckout} disabled={items.length === 0}>
            <HugeiconsIcon icon={CoinsIcon} strokeWidth={2} className="size-6 mr-2" />
            Cobrar
          </Button>
        </div>
      </div>

      {/* Modal cantidad */}
      <GenericModal
        open={qtyModalOpen}
        onOpenChange={(open) => { setQtyModalOpen(open); if (!open) focusSearch(); }}
        title="Agregar producto"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setQtyModalOpen(false); focusSearch(); }} className="h-11 px-6 text-base">Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 h-11 px-6 text-base" onClick={() => selectedProduct && confirmAddProduct(selectedProduct, parseInt(qtyInput) || 1)}>
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
                      if (e.key === "Enter") { e.preventDefault(); confirmAddProduct(selectedProduct, parseInt(qtyInput) || 1); }
                      if (e.key === "Escape") { setQtyModalOpen(false); focusSearch(); }
                    }}
                    className={`!text-2xl text-center h-12 font-bold ${overStock ? "border-red-500 focus:border-red-500" : ""}`}
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

      {/* Modal cobrar */}
      <GenericModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        title="Cobrar"
        description={`Total: $${fmt(total)}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} disabled={processing}>Cancelar</Button>
            <Button onClick={handleConfirmSale} disabled={processing || remaining > 0.01} className="bg-red-600 hover:bg-red-700">
              {processing ? "Procesando..." : "Confirmar Venta"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex justify-between text-xl font-bold">
            <span className="text-neutral-900 dark:text-white">Total</span>
            <span className="text-red-600 dark:text-red-500 tabular-nums">${fmt(total)}</span>
          </div>
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <div className="flex gap-2">
              <Select value={newPaymentMethodId} onValueChange={(v) => { setNewPaymentMethodId(v); setNewPaymentAmount(String(Math.max(0, remaining))); }}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Método..." /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm) => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                ref={paymentAmountRef}
                type="number"
                min="0"
                step="100"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); payments.length > 0 ? handleConfirmSale() : handleAddPayment(); } }}
                placeholder="Monto"
                className="w-32"
              />
              <Button onClick={handleAddPayment} size="icon">
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
              </Button>
            </div>
          </div>
          {payments.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-neutral-50 dark:bg-neutral-900 rounded px-3 py-2">
                  <span className="text-neutral-700 dark:text-neutral-300">{p.paymentMethodName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-900 dark:text-white tabular-nums">${fmt(p.amount)}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => removePayment(i)}>
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Pagado</span>
              <span className="text-green-600 dark:text-green-400 tabular-nums">${fmt(totalPaid)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-neutral-700 dark:text-neutral-300">Restante</span>
              <span className={remaining > 0.01 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}>${fmt(Math.max(0, remaining))}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between font-bold text-base">
                <span className="text-blue-600 dark:text-blue-400">Cambio</span>
                <span className="text-blue-600 dark:text-blue-400 tabular-nums">${fmt(change)}</span>
              </div>
            )}
          </div>
        </div>
      </GenericModal>

      {/* Modal ticket */}
      <GenericModal
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        title="Ticket de Venta"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setTicketOpen(false)}>Cerrar</Button>
            <Button onClick={() => window.print()}>
              <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4 mr-2" />
              Imprimir
            </Button>
          </>
        }
      >
        {lastSale && (
          <div className="font-mono text-sm space-y-3">
            <div className="text-center border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <p className="font-bold text-neutral-900 dark:text-white">SISTEMA VENTIX</p>
              <p className="text-neutral-500 dark:text-neutral-400">Ticket #{lastSale.receiptNumber || "—"}</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">{new Date(lastSale.createdAt).toLocaleString("es-AR")}</p>
            </div>
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
              {lastSale.saleItems?.map((item, i) => (
                <div key={i} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                  <span>{item.product?.name || "—"} x{item.quantity}</span>
                  <span className="tabular-nums">${item.subtotal}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-neutral-900 dark:text-white text-lg">
              <span>TOTAL</span>
              <span className="tabular-nums">${lastSale.total}</span>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 space-y-1">
              {lastSale.salePayments?.map((p, i) => (
                <div key={i} className="flex justify-between text-neutral-500 dark:text-neutral-400 text-sm">
                  <span>{p.paymentMethod?.name || "—"}</span>
                  <span className="tabular-nums">${p.amount}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-neutral-400 dark:text-neutral-500 text-sm pt-2">¡Gracias por su compra!</p>
          </div>
        )}
      </GenericModal>

      {/* Modal recuperar carrito */}
      <ConfirmModal
        open={recoverOpen}
        onOpenChange={setRecoverOpen}
        title="Venta en progreso"
        description="Se encontró una venta sin completar. ¿Desea recuperarla?"
        onConfirm={() => { setRecoverOpen(false); toast.success("Venta recuperada"); }}
        onCancel={() => { clearCart(); setRecoverOpen(false); }}
        confirmText="Recuperar"
        cancelText="Descartar"
      />
    </div>
  );
}
