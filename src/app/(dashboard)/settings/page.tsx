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
import { employeeClientService } from "@/services/employee.service";
import { clientErrorHandler, clientSuccessHandler } from "@/utils/handlers/clientHandler";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";

interface Employee {
  id: string;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface EmployeeForm {
  name: string;
  username: string;
  pin: string;
  role: string;
}

const emptyForm: EmployeeForm = {
  name: "",
  username: "",
  pin: "",
  role: "CASHIER",
};

export default function SettingsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const initialLoadDone = useRef<boolean | null>(null);

  const loadEmployees = useCallback(async (s?: string) => {
    setLoading(true);
    try {
      const result = await employeeClientService.findAll({ search: s });
      setEmployees(Array.isArray(result) ? result : []);
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
      loadEmployees();
    }
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [loadEmployees]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => loadEmployees(value), 300);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      username: emp.username,
      pin: "",
      role: emp.role,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.username) {
      toast.error("Complete los campos obligatorios");
      return;
    }
    if (!editingId && !form.pin) {
      toast.error("El PIN es obligatorio para nuevos empleados");
      return;
    }
    if (form.pin && !/^\d{6}$/.test(form.pin)) {
      toast.error("El PIN debe tener exactamente 6 dígitos");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          name: form.name,
          username: form.username,
          role: form.role,
        };
        if (form.pin) payload.pin = form.pin;
        await employeeClientService.update(editingId, payload);
        clientSuccessHandler("Empleado actualizado");
      } else {
        await employeeClientService.create({
          name: form.name,
          username: form.username,
          pin: form.pin,
          role: form.role,
        });
        clientSuccessHandler("Empleado creado");
      }

      setModalOpen(false);
      loadEmployees(search);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await employeeClientService.delete(deletingId);
      clientSuccessHandler("Empleado desactivado");
      setDeleteOpen(false);
      loadEmployees(search);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Nombre",
      render: (e: Employee) => (
        <span className={e.isActive ? "text-neutral-900 dark:text-white" : "text-neutral-500 line-through"}>
          {e.name}
        </span>
      ),
    },
    {
      key: "username",
      label: "Usuario",
      className: "w-32",
      render: (e: Employee) => (
        <span className="text-neutral-600 dark:text-neutral-300 font-mono text-sm">{e.username}</span>
      ),
    },
    {
      key: "role",
      label: "Rol",
      className: "w-28",
      render: (e: Employee) => (
        <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${
          e.role === "ADMIN"
            ? "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400"
            : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
        }`}>
          {e.role === "ADMIN" ? "Administrador" : "Cajero"}
        </span>
      ),
    },
    {
      key: "lastLoginAt",
      label: "Último acceso",
      className: "w-40",
      render: (e: Employee) => (
        <span className="text-neutral-400 text-sm">
          {e.lastLoginAt
            ? new Date(e.lastLoginAt).toLocaleString("es-AR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Nunca"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24 text-right",
      render: (e: Employee) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="icon-xs"
            onClick={(ev) => { ev.stopPropagation(); setDeletingId(e.id); setDeleteOpen(true); }}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Empleados"
        subtitle="Gestión de empleados y permisos"
        columns={columns}
        data={employees}
        keyExtractor={(e) => e.id}
        loading={loading}
        searchPlaceholder="Buscar empleado..."
        onSearch={handleSearch}
        actions={
          <Button onClick={openCreate}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            Nuevo Empleado
          </Button>
        }
        totalLabel={`${employees.length} empleados`}
      />

      <GenericModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Editar Empleado" : "Nuevo Empleado"}
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
            <Label htmlFor="emp-name">Nombre <span className="text-red-500">*</span></Label>
            <Input
              id="emp-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre completo"
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-username">Usuario <span className="text-red-500">*</span></Label>
              <Input
                id="emp-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="nombre.usuario"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-pin">
                PIN {editingId ? "(dejar vacío para no cambiar)" : <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="emp-pin"
                type="password"
                maxLength={6}
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                placeholder="6 dígitos"
                disabled={saving}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASHIER">Cajero</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GenericModal>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Desactivar empleado"
        description="El empleado será marcado como inactivo. ¿Desea continuar?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Desactivar"
      />
    </>
  );
}
