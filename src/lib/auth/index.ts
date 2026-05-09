import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Employee } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "generic_next_pos_secret_key";

interface SessionPayload {
  userId: string;
  role: string;
}

const sessionCache = new Map<string, { employee: Employee; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function createSession(
  userId: string,
  role: string,
): Promise<string> {
  const payload: SessionPayload = { userId, role };
  return sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export async function validateSession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const payload = verify(token, JWT_SECRET) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPin(pin: string): Promise<string> {
  return hash(pin, 10);
}

export async function verifyPin(
  pin: string,
  pinHash: string,
): Promise<boolean> {
  return compare(pin, pinHash);
}

export async function getCurrentEmployee(authHeader?: string): Promise<Employee | null> {
  let token: string | undefined;

  // Intentar leer del header Authorization (app móvil)
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Fallback a cookie (web)
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("auth-token")?.value;
  }

  if (!token) return null;

  try {
    const payload = await validateSession(token);
    if (!payload) return null;

    const cached = sessionCache.get(payload.userId);
    if (cached && cached.expires > Date.now()) {
      return cached.employee;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: payload.userId },
    });

    if (employee) {
      sessionCache.set(payload.userId, {
        employee,
        expires: Date.now() + CACHE_TTL,
      });
    }

    return employee;
  } catch {
    return null;
  }
}