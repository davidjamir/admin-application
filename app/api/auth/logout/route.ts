import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
  });
  return response;
}
