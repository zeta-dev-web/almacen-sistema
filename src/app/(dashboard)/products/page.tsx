"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DataTable } from "@/components/common/DataTable";
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
import { productClientService } from "@/services/product.service";
import { categoryClientService } from "@/services/category.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface Product {
  id: string;
  barcode: string | null;
  name: string;
  description: string | null;
  price: number;
  costPrice: number;
  categoryId: string;
  isActive: boolean;
  category: Category;
  stock: { quantity: number; minStock: number; maxStock: number | null } | null;
}

interface ProductForm {
  barcode: string;
  name: string;
  description: string;
  price: string;
  costPrice: string;
  categoryId: string;
  initialStock: string;
  minStock: string;
}

const emptyForm: ProductForm = {
  barcode: "",
  name: "",
  description: "",
  price: "",
  costPrice: "",
  categoryId: "",
  initialStock: "0",
  minStock: "5",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
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

  const loadCategories = useCallback(async () => {
    try {
      const result = await categoryClientService.findAll();
      setCategories(Array.isArray(result) ? result : result.items || []);
    } catch (error) {
      clientErrorHandler(error);
    }
  }, []);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (initialLoadDone.current == null) {
      initialLoadDone.current = true;
      loadProducts(undefined, 1, 10);
      loadCategories();
    }
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [loadProducts, loadCategories]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => loadProducts(value, 1, pageSize), 300);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      barcode: product.barcode || "",
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      costPrice: String(product.costPrice),
      categoryId: product.categoryId,
      initialStock: String(product.stock?.quantity || 0),
      minStock: String(product.stock?.minStock || 5),
    });
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.categoryId || !form.price || !form.costPrice) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        barcode: form.barcode || undefined,
        description: form.description || undefined,
        price: parseFloat(form.price),
        costPrice: parseFloat(form.costPrice),
        categoryId: form.categoryId,
        initialStock: parseInt(form.initialStock) || 0,
        minStock: parseInt(form.minStock) || 5,
      };

      if (editingId) {
        await productClientService.update(editingId, {
          ...payload,
          minStock: payload.minStock,
        });
        clientSuccessHandler("Producto actualizado");
      } else {
        await productClientService.create(payload);
        clientSuccessHandler("Producto creado");
      }

    setModalOpen(false);
    loadProducts(search, page, pageSize);
  } catch (error) {
    clientErrorHandler(error);
  } finally {
    setSaving(false);
  }
};

const handleDelete = async () => {
  if (!deletingId) return;
  try {
    await productClientService.delete(deletingId);
    clientSuccessHandler("Producto desactivado");
    setDeleteOpen(false);
    loadProducts(search, page, pageSize);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const stockBadge = (product: Product) => {
    const qty = product.stock?.quantity ?? 0;
    const min = product.stock?.minStock ?? 5;
    if (qty === 0)
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3" />
          Sin stock
        </span>
      );
    if (qty <= min)
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3" />
          Bajo
        </span>
      );
    return (
      <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">
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
        <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400">
          {p.barcode || "—"}
        </span>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      render: (p: Product) => (
        <div>
          <span className={`text-base font-medium ${p.isActive ? "text-neutral-900 dark:text-white" : "text-neutral-500 line-through"}`}>
            {p.name}
          </span>
          {p.description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-0.5">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Categoría",
      className: "w-32",
      hideOnMobile: true,
      render: (p: Product) => (
        <span className="text-neutral-600 dark:text-neutral-300 text-sm">{p.category?.name || "—"}</span>
      ),
    },
    {
      key: "price",
      label: "Precio",
      className: "w-28 text-right",
      render: (p: Product) => (
        <span className="text-neutral-900 dark:text-white font-bold text-lg tabular-nums">
          ${p.price.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: "costPrice",
      label: "Costo",
      className: "w-28 text-right",
      render: (p: Product) => (
        <span className="text-neutral-600 dark:text-neutral-300 text-base tabular-nums">
          ${p.costPrice.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      className: "w-24 text-center",
      hideOnMobile: true,
      render: (p: Product) => stockBadge(p),
    },
    {
      key: "actions",
      label: "",
      className: "w-28 text-right",
      render: (p: Product) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
            className="h-9 w-9 md:h-8 md:w-8"
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openDelete(p.id);
            }}
            className="h-9 w-9 md:h-8 md:w-8"
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Productos"
        subtitle="Gestión de productos del inventario"
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        loading={loading}
        searchPlaceholder="Buscar por nombre o código..."
        onSearch={handleSearch}
        actions={
          <Button onClick={openCreate} className="h-11 px-6 text-base font-semibold hover:bg-red-600">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5" />
            Nuevo Producto
          </Button>
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
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Editar Producto" : "Nuevo Producto"}
        description={
          editingId
            ? "Modifique los datos del producto"
            : "Complete los datos del nuevo producto"
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Escanear o escribir"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del producto"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción opcional"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Categoría <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio venta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">
                Precio costo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                placeholder="0"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="initialStock">Stock inicial</Label>
                <Input
                  id="initialStock"
                  type="number"
                  min="0"
                  value={form.initialStock}
                  onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                  disabled={saving}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock mínimo</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </GenericModal>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Desactivar producto"
        description="El producto será marcado como inactivo. ¿Desea continuar?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Desactivar"
      />
    </>
  );
}