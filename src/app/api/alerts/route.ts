import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, facilities, wasteLogs, violations, inspections } from "@/db/schema";
import { eq, desc, count, and, sql, isNull, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status) {
      conditions.push(
        eq(alerts.status, status as "active" | "acknowledged" | "resolved")
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: alerts.id,
        type: alerts.type,
        status: alerts.status,
        title: alerts.title,
        message: alerts.message,
        severity: alerts.severity,
        facilityId: alerts.facilityId,
        facilityName: facilities.name,
        wasteLogId: alerts.wasteLogId,
        violationId: alerts.violationId,
        inspectionId: alerts.inspectionId,
        acknowledgedAt: alerts.acknowledgedAt,
        resolvedAt: alerts.resolvedAt,
        createdAt: alerts.createdAt,
      })
      .from(alerts)
      .leftJoin(facilities, eq(alerts.facilityId, facilities.id));

    const [data, totalResult] = await Promise.all([
      whereClause
        ? baseQuery
            .where(whereClause)
            .orderBy(desc(alerts.createdAt))
            .limit(limit)
            .offset(offset)
        : baseQuery.orderBy(desc(alerts.createdAt)).limit(limit).offset(offset),
      whereClause
        ? db.select({ count: count() }).from(alerts).where(whereClause)
        : db.select({ count: count() }).from(alerts),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// Generate alerts automatically
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Manual alert creation
    if (body.manual) {
      const result = await db
        .insert(alerts)
        .values({
          type: body.type,
          title: body.title,
          message: body.message,
          severity: body.severity || "medium",
          facilityId: body.facilityId || null,
          wasteLogId: body.wasteLogId || null,
          violationId: body.violationId || null,
          inspectionId: body.inspectionId || null,
        })
        .returning();
      return NextResponse.json(result[0], { status: 201 });
    }

    // Auto-generate alerts
    const newAlerts = [];
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // 1. Check for overdue collections (waste not collected in 48 hours)
    const overdueWaste = await db
      .select({
        id: wasteLogs.id,
        facilityId: wasteLogs.facilityId,
        facilityName: facilities.name,
        category: wasteLogs.category,
        quantityKg: wasteLogs.quantityKg,
        createdAt: wasteLogs.createdAt,
      })
      .from(wasteLogs)
      .leftJoin(facilities, eq(wasteLogs.facilityId, facilities.id))
      .where(
        and(
          isNull(wasteLogs.collectedAt),
          lt(wasteLogs.createdAt, twoDaysAgo)
        )
      )
      .limit(50);

    for (const waste of overdueWaste) {
      // Check if alert already exists
      const existingAlert = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.wasteLogId, waste.id),
            eq(alerts.type, "overdue_collection"),
            eq(alerts.status, "active")
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        newAlerts.push({
          type: "overdue_collection" as const,
          title: "Overdue Waste Collection",
          message: `${parseFloat(waste.quantityKg).toFixed(2)} kg of ${waste.category} waste at ${waste.facilityName} has not been collected for over 48 hours.`,
          severity: waste.category === "cytotoxic" || waste.category === "chemical" ? "critical" : "high",
          facilityId: waste.facilityId,
          wasteLogId: waste.id,
        });
      }
    }

    // 2. Check for non-compliant facilities
    const nonCompliantFacilities = await db
      .select()
      .from(facilities)
      .where(eq(facilities.complianceStatus, "non_compliant"));

    for (const facility of nonCompliantFacilities) {
      const existingAlert = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.facilityId, facility.id),
            eq(alerts.type, "non_compliant"),
            eq(alerts.status, "active")
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        newAlerts.push({
          type: "non_compliant" as const,
          title: "Non-Compliant Facility",
          message: `${facility.name} is marked as non-compliant. Immediate action required.`,
          severity: "critical",
          facilityId: facility.id,
        });
      }
    }

    // 3. Check for unresolved critical violations
    const criticalViolations = await db
      .select({
        id: violations.id,
        facilityId: violations.facilityId,
        facilityName: facilities.name,
        description: violations.description,
      })
      .from(violations)
      .leftJoin(facilities, eq(violations.facilityId, facilities.id))
      .where(
        and(
          eq(violations.severity, "critical"),
          eq(violations.isResolved, false)
        )
      );

    for (const violation of criticalViolations) {
      const existingAlert = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.violationId, violation.id),
            eq(alerts.type, "violation_found"),
            eq(alerts.status, "active")
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        newAlerts.push({
          type: "violation_found" as const,
          title: "Critical Violation Unresolved",
          message: `Critical violation at ${violation.facilityName}: ${violation.description}`,
          severity: "critical",
          facilityId: violation.facilityId,
          violationId: violation.id,
        });
      }
    }

    // Insert all new alerts
    if (newAlerts.length > 0) {
      await db.insert(alerts).values(newAlerts);
    }

    return NextResponse.json({
      success: true,
      generated: newAlerts.length,
    });
  } catch (error) {
    console.error("POST /api/alerts error:", error);
    return NextResponse.json(
      { error: "Failed to generate alerts" },
      { status: 500 }
    );
  }
}
