import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser[0] || currentUser[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!["admin", "inspector", "facility_manager"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ 
        role: body.role as "admin" | "inspector" | "facility_manager",
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT role error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
