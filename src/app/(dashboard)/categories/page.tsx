"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DataTable } from "@/components/common/DataTable";
import { GenericModal, ConfirmModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoryClientService } from "@/services/category.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  _count: { products: number };
}

interface CategoryForm {
  name: string;
  description: string;
  color: string;
}

const emptyForm: CategoryForm = { name: "", description: "", color: "" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const initialLoadDone = useRef<boolean | null>(null);

  const loadCategories = useCallback(async (s?: string, p?: number, ps?: number) => {
    setLoading(true);
    try {
      const result = await categoryClientService.findAll({ search: s, page: p, limit: ps });
      setCategories(Array.isArray(result) ? result : result.items || []);
      setTotal(Array.isArray(result) ? result.length : result.total || 0);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (initialLoadDone.current == null) {
      initialLoadDone.current = true;
      loadCategories(undefined, 1, 10);
    }
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [loadCategories]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => loadCategories(value, 1, pageSize), 300);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || "",
      color: cat.color || "",
    });
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        color: form.color || undefined,
      };

      if (editingId) {
        await categoryClientService.update(editingId, payload);
        clientSuccessHandler("Categoría actualizada");
      } else {
        await categoryClientService.create(payload);
        clientSuccessHandler("Categoría creada");
      }

    setModalOpen(false);
    loadCategories(search, page, pageSize);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await categoryClientService.delete(deletingId);
      clientSuccessHandler("Categoría eliminada");
    setDeleteOpen(false);
    loadCategories(search, page, pageSize);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const columns = [
    {
      key: "color",
      label: "",
      className: "w-10",
      render: (c: Category) =>
        c.color ? (
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: c.color }}
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        ),
    },
    {
      key: "name",
      label: "Nombre",
      render: (c: Category) => <span className="text-neutral-900 dark:text-white text-base font-medium">{c.name}</span>,
    },
    {
      key: "description",
      label: "Descripción",
      hideOnMobile: true,
      render: (c: Category) => (
        <span className="text-neutral-500 dark:text-neutral-400">{c.description || "—"}</span>
      ),
    },
    {
      key: "products",
      label: "Productos",
      className: "w-24 text-center",
      render: (c: Category) => (
        <span className="text-neutral-600 dark:text-neutral-300 tabular-nums">{c._count.products}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-28 text-right",
      render: (c: Category) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(c);
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
              openDelete(c.id);
            }}
            disabled={c._count.products > 0}
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
        title="Categorías"
        subtitle="Agrupación de productos por categoría"
        columns={columns}
        data={categories}
        keyExtractor={(c) => c.id}
        loading={loading}
        searchPlaceholder="Buscar categoría..."
        onSearch={handleSearch}
        actions={
          <Button onClick={openCreate} className="h-11 px-6 text-base font-semibold hover:bg-red-600">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5" />
            Nueva Categoría
          </Button>
        }
        totalLabel={`${total} categorías`}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: (p) => { setPage(p); loadCategories(search, p, pageSize); },
          onPageSizeChange: (s) => { setPageSize(s); setPage(1); loadCategories(search, 1, s); },
        }}
      />

      <GenericModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Editar Categoría" : "Nueva Categoría"}
        size="md"
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
          <div className="space-y-2">
            <Label htmlFor="cat-name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre de la categoría"
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Descripción</Label>
            <Input
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción opcional"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="cat-color"
                type="color"
                value={form.color || "#6b7280"}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-12 h-9 p-1 cursor-pointer"
                disabled={saving}
              />
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="#6b7280"
                disabled={saving}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </GenericModal>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar categoría"
        description="Esta acción no se puede deshacer. ¿Desea continuar?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Eliminar"
      />
    </>
  );
}