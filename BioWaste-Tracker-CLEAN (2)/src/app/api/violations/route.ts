import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { violations, facilities, inspections } from "@/db/schema";
import { eq, desc, count, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const facilityId = url.searchParams.get("facilityId");
    const inspectionId = url.searchParams.get("inspectionId");
    const resolved = url.searchParams.get("resolved");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (facilityId)
      conditions.push(eq(violations.facilityId, parseInt(facilityId)));
    if (inspectionId)
      conditions.push(
        eq(violations.inspectionId, parseInt(inspectionId))
      );
    if (resolved === "true")
      conditions.push(eq(violations.isResolved, true));
    if (resolved === "false")
      conditions.push(eq(violations.isResolved, false));

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: violations.id,
        inspectionId: violations.inspectionId,
        facilityId: violations.facilityId,
        facilityName: facilities.name,
        severity: violations.severity,
        category: violations.category,
        description: violations.description,
        correctiveAction: violations.correctiveAction,
        deadline: violations.deadline,
        resolvedAt: violations.resolvedAt,
        isResolved: violations.isResolved,
        fineAmount: violations.fineAmount,
        createdAt: violations.createdAt,
      })
      .from(violations)
      .leftJoin(facilities, eq(violations.facilityId, facilities.id));

    const [data, totalResult] = await Promise.all([
      whereClause
        ? baseQuery
            .where(whereClause)
            .orderBy(desc(violations.createdAt))
            .limit(limit)
            .offset(offset)
        : baseQuery
            .orderBy(desc(violations.createdAt))
            .limit(limit)
            .offset(offset),
      whereClause
        ? db
            .select({ count: count() })
            .from(violations)
            .where(whereClause)
        : db.select({ count: count() }).from(violations),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/violations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch violations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db
      .insert(violations)
      .values({
        inspectionId: parseInt(body.inspectionId),
        facilityId: parseInt(body.facilityId),
        severity: body.severity,
        category: body.category,
        description: body.description,
        correctiveAction: body.correctiveAction || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        fineAmount: body.fineAmount ? body.fineAmount.toString() : null,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/violations error:", error);
    return NextResponse.json(
      { error: "Failed to create violation" },
      { status: 400 }
    );
  }
}
