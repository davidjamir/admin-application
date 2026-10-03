import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/bcrypt";
import { ObjectId } from "mongodb";

// GET /api/users - List all users (ADMIN only)
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const db = await getDb();
    const users = await db
      .collection("admins")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name || "",
      email: u.email || "",
      role: u.role || "ADMIN",
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users - Create a new user (ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if email already exists
    const existing = await db.collection("admins").findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { message: `An account with email "${cleanEmail}" already exists` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole = role?.toUpperCase() === "EDITOR" ? "EDITOR" : role?.toUpperCase() === "VIEWER" ? "VIEWER" : "ADMIN";

    const insertResult = await db.collection("admins").insertOne({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "User account created successfully",
        user: {
          id: insertResult.insertedId.toString(),
          name: name.trim(),
          email: cleanEmail,
          role: assignedRole,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users - Delete user (ADMIN only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    if (userId === session.id) {
      return NextResponse.json(
        { message: "You cannot delete your own active administrator account" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("admins").deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User account deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
