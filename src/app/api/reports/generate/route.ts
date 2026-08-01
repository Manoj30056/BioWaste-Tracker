import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { facilities, wasteLogs, inspections, violations, alerts } from "@/db/schema";
import { eq, count, sum, desc, and, gte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const facilityId = url.searchParams.get("facilityId");
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Facility statistics
    const facilityStats = await db
      .select({
        total: count(),
        compliant: sql<number>`count(case when ${facilities.complianceStatus} = 'compliant' then 1 end)`,
        nonCompliant: sql<number>`count(case when ${facilities.complianceStatus} = 'non_compliant' then 1 end)`,
        pendingReview: sql<number>`count(case when ${facilities.complianceStatus} = 'pending_review' then 1 end)`,
        suspended: sql<number>`count(case when ${facilities.complianceStatus} = 'suspended' then 1 end)`,
      })
      .from(facilities)
      .where(eq(facilities.isActive, true));

    // Waste statistics
    const wasteConditions = [gte(wasteLogs.createdAt, startDate)];
    if (facilityId) {
      wasteConditions.push(eq(wasteLogs.facilityId, parseInt(facilityId)));
    }

    const wasteStats = await db
      .select({
        totalKg: sum(wasteLogs.quantityKg),
        totalEntries: count(),
      })
      .from(wasteLogs)
      .where(and(...wasteConditions));

    const wasteByCategory = await db
      .select({
        category: wasteLogs.category,
        totalKg: sum(wasteLogs.quantityKg),
        entries: count(),
      })
      .from(wasteLogs)
      .where(and(...wasteConditions))
      .groupBy(wasteLogs.category);

    // Collection statistics
    const collectionStats = await db
      .select({
        collected: sql<number>`count(case when ${wasteLogs.collectedAt} is not null then 1 end)`,
        pending: sql<number>`count(case when ${wasteLogs.collectedAt} is null then 1 end)`,
      })
      .from(wasteLogs)
      .where(and(...wasteConditions));

    // Inspection statistics
    const inspectionStats = await db
      .select({
        total: count(),
        completed: sql<number>`count(case when ${inspections.status} = 'completed' then 1 end)`,
        scheduled: sql<number>`count(case when ${inspections.status} = 'scheduled' then 1 end)`,
        spotChecks: sql<number>`count(case when ${inspections.isSpotCheck} = true then 1 end)`,
        avgScore: sql<number>`avg(${inspections.overallScore})`,
      })
      .from(inspections)
      .where(gte(inspections.createdAt, startDate));

    // Violation statistics
    const violationStats = await db
      .select({
        total: count(),
        resolved: sql<number>`count(case when ${violations.isResolved} = true then 1 end)`,
        critical: sql<number>`count(case when ${violations.severity} = 'critical' then 1 end)`,
        major: sql<number>`count(case when ${violations.severity} = 'major' then 1 end)`,
        minor: sql<number>`count(case when ${violations.severity} = 'minor' then 1 end)`,
      })
      .from(violations)
      .where(gte(violations.createdAt, startDate));

    // Alert statistics
    const alertStats = await db
      .select({
        total: count(),
        active: sql<number>`count(case when ${alerts.status} = 'active' then 1 end)`,
        acknowledged: sql<number>`count(case when ${alerts.status} = 'acknowledged' then 1 end)`,
        resolved: sql<number>`count(case when ${alerts.status} = 'resolved' then 1 end)`,
      })
      .from(alerts)
      .where(gte(alerts.createdAt, startDate));

    // Recent violations list
    const recentViolations = await db
      .select({
        id: violations.id,
        facilityName: facilities.name,
        severity: violations.severity,
        category: violations.category,
        description: violations.description,
        isResolved: violations.isResolved,
        createdAt: violations.createdAt,
      })
      .from(violations)
      .leftJoin(facilities, eq(violations.facilityId, facilities.id))
      .where(gte(violations.createdAt, startDate))
      .orderBy(desc(violations.createdAt))
      .limit(10);

    // High-risk facilities (non-compliant or with violations)
    const highRiskFacilities = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        type: facilities.type,
        city: facilities.city,
        complianceStatus: facilities.complianceStatus,
        violationCount: sql<number>`(
          select count(*) from ${violations} 
          where ${violations.facilityId} = ${facilities.id} 
          and ${violations.isResolved} = false
        )`,
      })
      .from(facilities)
      .where(
        sql`${facilities.complianceStatus} in ('non_compliant', 'suspended') 
            or exists (
              select 1 from ${violations} 
              where ${violations.facilityId} = ${facilities.id} 
              and ${violations.isResolved} = false
            )`
      )
      .limit(10);

    const report = {
      generatedAt: new Date().toISOString(),
      periodDays: days,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      
      summary: {
        facilities: {
          total: facilityStats[0]?.total || 0,
          compliant: facilityStats[0]?.compliant || 0,
          nonCompliant: facilityStats[0]?.nonCompliant || 0,
          pendingReview: facilityStats[0]?.pendingReview || 0,
          suspended: facilityStats[0]?.suspended || 0,
          complianceRate: facilityStats[0]?.total 
            ? ((facilityStats[0]?.compliant || 0) / facilityStats[0]?.total * 100).toFixed(1)
            : "0",
        },
        waste: {
          totalKg: parseFloat(wasteStats[0]?.totalKg || "0").toFixed(2),
          totalEntries: wasteStats[0]?.totalEntries || 0,
          byCategory: wasteByCategory.map(c => ({
            category: c.category,
            totalKg: parseFloat(c.totalKg || "0").toFixed(2),
            entries: c.entries,
          })),
          collected: collectionStats[0]?.collected || 0,
          pendingCollection: collectionStats[0]?.pending || 0,
          collectionRate: wasteStats[0]?.totalEntries 
            ? ((collectionStats[0]?.collected || 0) / wasteStats[0]?.totalEntries * 100).toFixed(1)
            : "0",
        },
        inspections: {
          total: inspectionStats[0]?.total || 0,
          completed: inspectionStats[0]?.completed || 0,
          scheduled: inspectionStats[0]?.scheduled || 0,
          spotChecks: inspectionStats[0]?.spotChecks || 0,
          averageScore: inspectionStats[0]?.avgScore 
            ? parseFloat(String(inspectionStats[0]?.avgScore)).toFixed(1)
            : "N/A",
        },
        violations: {
          total: violationStats[0]?.total || 0,
          resolved: violationStats[0]?.resolved || 0,
          open: (violationStats[0]?.total || 0) - (violationStats[0]?.resolved || 0),
          critical: violationStats[0]?.critical || 0,
          major: violationStats[0]?.major || 0,
          minor: violationStats[0]?.minor || 0,
          resolutionRate: violationStats[0]?.total 
            ? ((violationStats[0]?.resolved || 0) / violationStats[0]?.total * 100).toFixed(1)
            : "100",
        },
        alerts: {
          total: alertStats[0]?.total || 0,
          active: alertStats[0]?.active || 0,
          acknowledged: alertStats[0]?.acknowledged || 0,
          resolved: alertStats[0]?.resolved || 0,
        },
      },
      
      details: {
        recentViolations,
        highRiskFacilities,
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
