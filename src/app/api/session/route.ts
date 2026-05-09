import { NextResponse } from "next/server";
import { getCurrentEmployee } from "@/lib/auth";

export async function GET() {
  try {
    const employee = await getCurrentEmployee();

    if (!employee) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Error checking session" },
      { status: 500 },
    );
  }
}