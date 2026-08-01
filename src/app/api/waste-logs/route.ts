import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wasteLogs, facilities } from "@/db/schema";
import { eq, desc, count, and, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const facilityId = url.searchParams.get("facilityId");
    const category = url.searchParams.get("category");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (facilityId) {
      conditions.push(eq(wasteLogs.facilityId, parseInt(facilityId)));
    }
    if (category) {
      conditions.push(
        eq(
          wasteLogs.category,
          category as
            | "yellow"
            | "red"
            | "blue"
            | "white"
            | "cytotoxic"
            | "chemical"
            | "general"
        )
      );
    }
    if (startDate) {
      conditions.push(gte(wasteLogs.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(wasteLogs.createdAt, new Date(endDate)));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: wasteLogs.id,
        facilityId: wasteLogs.facilityId,
        facilityName: facilities.name,
        category: wasteLogs.category,
        quantityKg: wasteLogs.quantityKg,
        description: wasteLogs.description,
        disposalMethod: wasteLogs.disposalMethod,
        handlerName: wasteLogs.handlerName,
        manifestNumber: wasteLogs.manifestNumber,
        storageLocation: wasteLogs.storageLocation,
        collectedAt: wasteLogs.collectedAt,
        createdAt: wasteLogs.createdAt,
      })
      .from(wasteLogs)
      .leftJoin(facilities, eq(wasteLogs.facilityId, facilities.id));

    const [data, totalResult] = await Promise.all([
      whereClause
        ? baseQuery
            .where(whereClause)
            .orderBy(desc(wasteLogs.createdAt))
            .limit(limit)
            .offset(offset)
        : baseQuery
            .orderBy(desc(wasteLogs.createdAt))
            .limit(limit)
            .offset(offset),
      whereClause
        ? db.select({ count: count() }).from(wasteLogs).where(whereClause)
        : db.select({ count: count() }).from(wasteLogs),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/waste-logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waste logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db
      .insert(wasteLogs)
      .values({
        facilityId: parseInt(body.facilityId),
        category: body.category,
        quantityKg: body.quantityKg.toString(),
        description: body.description || null,
        disposalMethod: body.disposalMethod || null,
        handlerName: body.handlerName || null,
        manifestNumber: body.manifestNumber || null,
        storageLocation: body.storageLocation || null,
        collectedAt: body.collectedAt ? new Date(body.collectedAt) : null,
      })
      .returning();

    const newLog = result[0]!;

    return NextResponse.json({
      ...newLog,
      trackingId: `BWM-${String(newLog.id).padStart(6, "0")}`,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/waste-logs error:", error);
    return NextResponse.json(
      { error: "Failed to create waste log" },
      { status: 400 }
    );
  }
}
