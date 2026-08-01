import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, facilities } from "@/db/schema";
import { eq, desc, count, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const facilityId = url.searchParams.get("facilityId");
    const status = url.searchParams.get("status");
    const isSpotCheck = url.searchParams.get("isSpotCheck");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (facilityId)
      conditions.push(eq(inspections.facilityId, parseInt(facilityId)));
    if (status)
      conditions.push(
        eq(
          inspections.status,
          status as "scheduled" | "in_progress" | "completed" | "cancelled"
        )
      );
    if (isSpotCheck === "true")
      conditions.push(eq(inspections.isSpotCheck, true));

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: inspections.id,
        facilityId: inspections.facilityId,
        facilityName: facilities.name,
        facilityType: facilities.type,
        status: inspections.status,
        scheduledDate: inspections.scheduledDate,
        completedDate: inspections.completedDate,
        isSpotCheck: inspections.isSpotCheck,
        overallScore: inspections.overallScore,
        segregationScore: inspections.segregationScore,
        storageScore: inspections.storageScore,
        documentationScore: inspections.documentationScore,
        trainingScore: inspections.trainingScore,
        notes: inspections.notes,
        createdAt: inspections.createdAt,
      })
      .from(inspections)
      .leftJoin(facilities, eq(inspections.facilityId, facilities.id));

    const [data, totalResult] = await Promise.all([
      whereClause
        ? baseQuery
            .where(whereClause)
            .orderBy(desc(inspections.scheduledDate))
            .limit(limit)
            .offset(offset)
        : baseQuery
            .orderBy(desc(inspections.scheduledDate))
            .limit(limit)
            .offset(offset),
      whereClause
        ? db
            .select({ count: count() })
            .from(inspections)
            .where(whereClause)
        : db.select({ count: count() }).from(inspections),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/inspections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db
      .insert(inspections)
      .values({
        facilityId: parseInt(body.facilityId),
        inspectorId: body.inspectorId || null,
        status: body.status || "scheduled",
        scheduledDate: new Date(body.scheduledDate),
        isSpotCheck: body.isSpotCheck || false,
        notes: body.notes || null,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/inspections error:", error);
    return NextResponse.json(
      { error: "Failed to create inspection" },
      { status: 400 }
    );
  }
}
