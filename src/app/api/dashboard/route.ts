import { NextResponse } from "next/server";
import { db } from "@/db";
import { facilities, wasteLogs, inspections, violations } from "@/db/schema";
import { count, eq, sum, sql, and, gte, desc } from "drizzle-orm";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalFacilities,
      facilityByStatus,
      totalWasteResult,
      wasteByCategory,
      recentInspections,
      inspectionStats,
      openViolations,
      violationsBySeverity,
      recentWasteLogs,
    ] = await Promise.all([
      db.select({ count: count() }).from(facilities),
      db
        .select({
          status: facilities.complianceStatus,
          count: count(),
        })
        .from(facilities)
        .groupBy(facilities.complianceStatus),
      db
        .select({ total: sum(wasteLogs.quantityKg) })
        .from(wasteLogs)
        .where(gte(wasteLogs.createdAt, thirtyDaysAgo)),
      db
        .select({
          category: wasteLogs.category,
          total: sum(wasteLogs.quantityKg),
          count: count(),
        })
        .from(wasteLogs)
        .where(gte(wasteLogs.createdAt, thirtyDaysAgo))
        .groupBy(wasteLogs.category),
      db
        .select({
          id: inspections.id,
          facilityId: inspections.facilityId,
          facilityName: facilities.name,
          status: inspections.status,
          scheduledDate: inspections.scheduledDate,
          isSpotCheck: inspections.isSpotCheck,
          overallScore: inspections.overallScore,
        })
        .from(inspections)
        .leftJoin(facilities, eq(inspections.facilityId, facilities.id))
        .orderBy(desc(inspections.scheduledDate))
        .limit(5),
      db
        .select({
          status: inspections.status,
          count: count(),
        })
        .from(inspections)
        .groupBy(inspections.status),
      db
        .select({ count: count() })
        .from(violations)
        .where(eq(violations.isResolved, false)),
      db
        .select({
          severity: violations.severity,
          count: count(),
        })
        .from(violations)
        .where(eq(violations.isResolved, false))
        .groupBy(violations.severity),
      db
        .select({
          id: wasteLogs.id,
          facilityName: facilities.name,
          category: wasteLogs.category,
          quantityKg: wasteLogs.quantityKg,
          createdAt: wasteLogs.createdAt,
        })
        .from(wasteLogs)
        .leftJoin(facilities, eq(wasteLogs.facilityId, facilities.id))
        .orderBy(desc(wasteLogs.createdAt))
        .limit(10),
    ]);

    return NextResponse.json({
      facilities: {
        total: totalFacilities[0]?.count || 0,
        byStatus: facilityByStatus,
      },
      waste: {
        totalKgLast30Days: totalWasteResult[0]?.total || "0",
        byCategory: wasteByCategory,
      },
      inspections: {
        recent: recentInspections,
        byStatus: inspectionStats,
      },
      violations: {
        openCount: openViolations[0]?.count || 0,
        bySeverity: violationsBySeverity,
      },
      recentWasteLogs,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
