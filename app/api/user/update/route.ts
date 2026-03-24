import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth/session";
import { hashPassword, comparePassword } from "@/lib/auth/bcrypt";
import { createToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, email, currentPassword, newPassword } = await req.json();

    const db = await getDb();
    const admin = await db.collection("admins").findOne({ _id: new ObjectId(session.id) });

    if (!admin) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password is required to set a new one" }, { status: 400 });
      }

      const isMatch = await comparePassword(currentPassword, admin.password);
      if (!isMatch) {
        return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
      }

      updateData.password = await hashPassword(newPassword);
    }

    await db.collection("admins").updateOne(
      { _id: new ObjectId(session.id) },
      { $set: updateData }
    );

    // Create a new token with updated information
    const newToken = await createToken({
      id: session.id,
      email: email || session.email,
      name: name || session.name,
      role: session.role,
    });

    const response = NextResponse.json({ message: "Profile updated successfully" });

    response.cookies.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
