"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShoppingCart01Icon,
  PackageIcon,
  CreditCardIcon,
  Store01Icon,
  ChartIcon,
  Settings01Icon,
  TagsIcon,
  TruckIcon,
  Archive01Icon,
  ArrowLeftRightIcon,
  ShoppingBag01Icon,
  UserIcon,
} from "hugeicons-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  role?: "ADMIN" | "CASHIER";
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Punto de Venta",
    href: "/pos",
    icon: <ShoppingCart01Icon size={20} />,
  },
  {
    title: "Productos",
    href: "/products",
    icon: <PackageIcon size={20} />,
  },
  {
    title: "Categorías",
    href: "/categories",
    icon: <TagsIcon size={20} />,
  },
  {
    title: "Proveedores",
    href: "/suppliers",
    icon: <TruckIcon size={20} />,
  },
  {
    title: "Stock",
    href: "/stock",
    icon: <Archive01Icon size={20} />,
  },
  {
    title: "Movimientos",
    href: "/stockmovements",
    icon: <ArrowLeftRightIcon size={20} />,
  },
  {
    title: "Ventas",
    href: "/sales",
    icon: <ShoppingBag01Icon size={20} />,
  },
  {
    title: "Compras",
    href: "/purchases",
    icon: <CreditCardIcon size={20} />,
  },
  {
    title: "Caja",
    href: "/cashdrawer",
    icon: <Store01Icon size={20} />,
  },
  {
    title: "Reportes",
    href: "/reports",
    icon: <ChartIcon size={20} />,
  },
  {
    title: "Configuración",
    href: "/settings",
    icon: <Settings01Icon size={20} />,
    role: "ADMIN",
  },
];

interface SidebarProps {
  userRole?: string;
}

interface SessionUser {
  id: string;
  name: string;
  role: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const filteredItems = sidebarItems.filter(
    (item) => !item.role || item.role === userRole,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-neutral-200 dark:border-neutral-800 px-6">
        <Link
          href="/pos"
          className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-lg"
        >
          <Store01Icon size={22} className="text-red-600 dark:text-red-500" />
          <span>POS</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-red-600/10 text-red-600 dark:text-red-500"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {item.icon}
              {item.title}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/10 text-red-600 dark:text-red-500">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.role === "ADMIN" ? "Administrador" : "Cajero"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}