"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loading02Icon, Store01Icon } from "hugeicons-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Credenciales inválidas");
        return;
      }

      router.push("/pos");
      router.refresh();
    } catch {
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-sm p-6">
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white dark:bg-neutral-950">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 dark:bg-red-600/10">
              <Store01Icon size={28} className="text-red-600 dark:text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
              Sistema POS
            </CardTitle>
            <CardDescription className="text-neutral-500 dark:text-neutral-400">
              Ingrese sus credenciales para continuar
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-neutral-600 dark:text-neutral-300">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  disabled={isLoading}
                  className="bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-neutral-600 dark:text-neutral-300">
                  PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  maxLength={6}
                  required
                  disabled={isLoading}
                  className="bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loading02Icon className="animate-spin size-5" />
                ) : (
                  "Ingresar"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}