import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPin, createSession } from "@/lib/auth";
import { ApiError } from "@/utils/handlers/apiError.handler";
import { status as httpStatus } from "http-status";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body.username ?? body.employeeId;

    const { pin } = body;

    if (!username || !pin) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: "Nombre de usuario y PIN son requeridos",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { username },
    });

    if (!employee) {
      throw new ApiError({
        status: httpStatus.UNAUTHORIZED,
        message: "Credenciales inválidas",
      });
    }

    if (employee.lockedUntil && employee.lockedUntil > new Date()) {
      throw new ApiError({
        status: httpStatus.FORBIDDEN,
        message: "Cuenta bloqueada temporalmente. Intente más tarde.",
      });
    }

    const isValid = await verifyPin(pin, employee.pinHash);

    if (!isValid) {
      const failedAttempts = employee.failedAttempts + 1;
      const lockedUntil =
        failedAttempts >= 5
          ? new Date(Date.now() + 15 * 60 * 1000)
          : employee.lockedUntil;

      await prisma.employee.update({
        where: { id: employee.id },
        data: { failedAttempts, lockedUntil },
      });

      throw new ApiError({
        status: httpStatus.UNAUTHORIZED,
        message: "Credenciales inválidas",
      });
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const token = await createSession(employee.id, employee.role);

    const response = NextResponse.json({
      success: true,
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}