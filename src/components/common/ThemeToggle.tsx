"use client";

import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { SunCloudIcon, MoonIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="opacity-0" />;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={isDark 
        ? "text-neutral-400 hover:text-yellow-400 hover:bg-neutral-800/50" 
        : "text-neutral-600 hover:text-orange-500 hover:bg-neutral-100"
      }
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      <HugeiconsIcon 
        icon={isDark ? SunCloudIcon : MoonIcon} 
        strokeWidth={2} 
        className="size-5 transition-transform duration-300" 
      />
    </Button>
  );
}