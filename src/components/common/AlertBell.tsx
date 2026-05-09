"use client";

import { useEffect, useState } from "react";
import { useAlertStore } from "@/stores/alert.store";
import { Button } from "@/components/ui/button";
import { GenericModal } from "@/components/common";
import { Notification03Icon, Cancel01Icon, Alert02Icon } from "hugeicons-react";

export function AlertBell() {
  const { alerts, count, loadAlerts, dismissAlert } = useAlertStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setModalOpen(true)}
        className="relative text-neutral-600 dark:text-neutral-400 hover:text-yellow-600 dark:hover:text-yellow-400"
        title="Alertas de stock"
      >
        <Notification03Icon size={20} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      <GenericModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Alertas de Stock Bajo"
        description={count > 0 ? `${count} producto${count > 1 ? "s" : ""} con stock bajo` : "No hay alertas"}
        size="lg"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">
              No hay alertas de stock bajo
            </p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Alert02Icon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-neutral-900 dark:text-white font-medium truncate">
                      {alert.product.name}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Stock actual: <span className="font-semibold text-yellow-700 dark:text-yellow-400">{alert.product.stock?.quantity || 0}</span>
                      {" · "}
                      Mínimo: <span className="font-semibold">{alert.minStock}</span>
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      {new Date(alert.createdAt).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dismissAlert(alert.id)}
                  className="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 shrink-0"
                  title="Descartar alerta"
                >
                  <Cancel01Icon className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </GenericModal>
    </>
  );
}
