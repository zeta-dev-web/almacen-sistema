"use client";

import { Sidebar } from "@/components/common/sidebar/Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Calculator } from "@/components/common";
import { ReactNode, useState, useEffect } from "react";
import { Calculator01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F7") {
        e.preventDefault();
        setCalculatorOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-neutral-50 dark:bg-neutral-950">
      {/* Overlay para mobile/tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-60 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCalculator={() => setCalculatorOpen(true)}
        />
        <main className="flex-1 p-6 pb-0 lg:pb-0">{children}</main>
      </div>

      {/* Botón flotante calculadora (solo mobile) */}
      <Button
        size="icon"
        className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-30"
        onClick={() => setCalculatorOpen(true)}
      >
        <Calculator01Icon className="h-6 w-6" />
      </Button>

      {/* Calculadora */}
      <Calculator open={calculatorOpen} onOpenChange={setCalculatorOpen} />
    </div>
  );
}