"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DataTable } from "@/components/common/DataTable";
import { GenericModal, ConfirmModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supplierClientService } from "@/services/supplier.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

interface SupplierForm {
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

const emptyForm: SupplierForm = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const initialLoadDone = useRef<boolean | null>(null);

  const loadSuppliers = useCallback(async (s?: string, p?: number, ps?: number) => {
    setLoading(true);
    try {
      const result = await supplierClientService.findAll({ search: s, page: p, limit: ps });
      setSuppliers(result.items || []);
      setTotal(result.total || 0);
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
      loadSuppliers(undefined, 1, 10);
    }
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [loadSuppliers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => loadSuppliers(value, 1, pageSize), 300);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
    });
    setModalOpen(true);
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
        contactName: form.contactName || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      };

      if (editingId) {
        await supplierClientService.update(editingId, payload);
        clientSuccessHandler("Proveedor actualizado");
      } else {
        await supplierClientService.create(payload);
        clientSuccessHandler("Proveedor creado");
      }

    setModalOpen(false);
    loadSuppliers(search, page, pageSize);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await supplierClientService.delete(deletingId);
      clientSuccessHandler("Proveedor desactivado");
    setDeleteOpen(false);
    loadSuppliers(search, page, pageSize);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Nombre",
      render: (s: Supplier) => (
        <span className={s.isActive ? "text-neutral-900 dark:text-white" : "text-neutral-500 line-through"}>
          {s.name}
        </span>
      ),
    },
    {
      key: "contactName",
      label: "Contacto",
      className: "w-36",
      hideOnMobile: true,
      render: (s: Supplier) => (
        <span className="text-neutral-600 dark:text-neutral-300">{s.contactName || "—"}</span>
      ),
    },
    {
      key: "phone",
      label: "Teléfono",
      className: "w-32",
      render: (s: Supplier) => (
        <span className="text-neutral-500 dark:text-neutral-400">{s.phone || "—"}</span>
      ),
    },
    {
      key: "email",
      label: "Email",
      className: "w-48",
      hideOnMobile: true,
      render: (s: Supplier) => (
        <span className="text-neutral-500 dark:text-neutral-400">{s.email || "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-28 text-right",
      render: (s: Supplier) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); openEdit(s); }}
            className="h-9 w-9 md:h-8 md:w-8"
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setDeletingId(s.id); setDeleteOpen(true); }}
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
        title="Proveedores"
        subtitle="Gestión de proveedores"
        columns={columns}
        data={suppliers}
        keyExtractor={(s) => s.id}
        loading={loading}
        searchPlaceholder="Buscar proveedor..."
        onSearch={handleSearch}
        actions={
          <Button onClick={openCreate} className="h-11 px-6 text-base font-semibold hover:bg-red-600">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5" />
            Nuevo Proveedor
          </Button>
        }
        totalLabel={`${total} proveedores`}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: (p) => { setPage(p); loadSuppliers(search, p, pageSize); },
          onPageSizeChange: (s) => { setPageSize(s); setPage(1); loadSuppliers(search, 1, s); },
        }}
      />

      <GenericModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Editar Proveedor" : "Nuevo Proveedor"}
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
            <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre del proveedor"
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contacto</Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Nombre del contacto"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Teléfono"
                disabled={saving}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@proveedor.com"
              disabled={saving}
            />
          </div>
        </div>
      </GenericModal>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Desactivar proveedor"
        description="El proveedor será marcado como inactivo. ¿Desea continuar?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Desactivar"
      />
    </>
  );
}
