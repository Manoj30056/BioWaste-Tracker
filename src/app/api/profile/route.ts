import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, facilities, wasteLogs, inspections, violations } from "@/db/schema";
import { eq, sum, count } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get facility if assigned
    let facility = null;
    if (user.facilityId) {
      const facilityResult = await db
        .select()
        .from(facilities)
        .where(eq(facilities.id, user.facilityId))
        .limit(1);
      facility = facilityResult[0] || null;
    }

    // Get stats
    let stats = {
      totalWasteKg: 0,
      wasteEntries: 0,
      inspections: 0,
      violations: 0,
      complianceScore: 0,
      wasteByCategory: [] as Array<{ category: string; total: string; count: number }>,
    };

    if (user.facilityId) {
      // Waste stats
      const wasteStats = await db
        .select({
          total: sum(wasteLogs.quantityKg),
          count: count(),
        })
        .from(wasteLogs)
        .where(eq(wasteLogs.facilityId, user.facilityId));

      stats.totalWasteKg = parseFloat(wasteStats[0]?.total || "0");
      stats.wasteEntries = wasteStats[0]?.count || 0;

      // Waste by category
      const wasteByCategory = await db
        .select({
          category: wasteLogs.category,
          total: sum(wasteLogs.quantityKg),
          count: count(),
        })
        .from(wasteLogs)
        .where(eq(wasteLogs.facilityId, user.facilityId))
        .groupBy(wasteLogs.category);

      stats.wasteByCategory = wasteByCategory.map(w => ({
        category: w.category,
        total: w.total || "0",
        count: w.count,
      }));

      // Inspection stats
      const inspectionStats = await db
        .select({ count: count() })
        .from(inspections)
        .where(eq(inspections.facilityId, user.facilityId));

      stats.inspections = inspectionStats[0]?.count || 0;

      // Violation stats
      const violationStats = await db
        .select({ count: count() })
        .from(violations)
        .where(eq(violations.facilityId, user.facilityId));

      stats.violations = violationStats[0]?.count || 0;

      // Get latest inspection score as compliance score
      const latestInspection = await db
        .select({ overallScore: inspections.overallScore })
        .from(inspections)
        .where(eq(inspections.facilityId, user.facilityId))
        .orderBy(inspections.completedDate)
        .limit(1);

      stats.complianceScore = latestInspection[0]?.overallScore || 0;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
      },
      facility: facility ? {
        id: facility.id,
        name: facility.name,
        type: facility.type,
        licenseNumber: facility.licenseNumber,
        city: facility.city,
        state: facility.state,
        complianceStatus: facility.complianceStatus,
      } : null,
      stats,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
