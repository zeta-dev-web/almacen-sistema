"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/common/GenericModal";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AlertBell } from "@/components/common";
import { Menu01Icon, Calculator01Icon } from "hugeicons-react";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenCalculator?: () => void;
}

export function DashboardHeader({ sidebarOpen, onToggleSidebar, onOpenCalculator }: DashboardHeaderProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const now = new Date();
  const nowArg = now.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <Menu01Icon size={20} />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-lg font-medium text-neutral-900 dark:text-white tabular-nums tracking-wide">
            {nowArg}
          </span>
          <AlertBell />
          {onOpenCalculator && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenCalculator}
              className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Calculadora (F7)"
            >
              <Calculator01Icon size={20} />
            </Button>
          )}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogoutOpen(true)}
            className="text-sm border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <ConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Cerrar Sesión"
        description="¿Quiere cerrar sesión?"
        onConfirm={handleLogout}
        confirmText="Sí, cerrar"
        cancelText="No"
      />
    </>
  );
}