import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { comparePassword } from "@/lib/auth/bcrypt";
import { createToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME, AUTH_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const admin = await db.collection("admins").findOne({ email });

    if (!admin) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordMatch = await comparePassword(password, admin.password);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json(
      { message: "Logged in successfully", user: { name: admin.name, email: admin.email } },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
