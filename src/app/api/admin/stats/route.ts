import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, facilities, wasteLogs } from "@/db/schema";
import { eq, count, sum } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser[0] || currentUser[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsersResult,
      pendingApprovalsResult,
      totalFacilitiesResult,
      totalWasteResult,
      usersByRoleResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.isApproved, false)),
      db.select({ count: count() }).from(facilities),
      db.select({ total: sum(wasteLogs.quantityKg) }).from(wasteLogs),
      db.select({ role: users.role, count: count() }).from(users).groupBy(users.role),
    ]);

    return NextResponse.json({
      totalUsers: totalUsersResult[0]?.count || 0,
      pendingApprovals: pendingApprovalsResult[0]?.count || 0,
      totalFacilities: totalFacilitiesResult[0]?.count || 0,
      totalWasteKg: parseFloat(totalWasteResult[0]?.total || "0"),
      usersByRole: usersByRoleResult,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
