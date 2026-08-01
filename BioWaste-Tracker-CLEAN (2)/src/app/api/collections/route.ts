import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collections, wasteLogs, facilities, alerts } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: collections.id,
          wasteLogId: collections.wasteLogId,
          collectorName: collections.collectorName,
          vehicleNumber: collections.vehicleNumber,
          collectedAt: collections.collectedAt,
          notes: collections.notes,
          facilityName: facilities.name,
          wasteCategory: wasteLogs.category,
          wasteQuantity: wasteLogs.quantityKg,
        })
        .from(collections)
        .leftJoin(wasteLogs, eq(collections.wasteLogId, wasteLogs.id))
        .leftJoin(facilities, eq(wasteLogs.facilityId, facilities.id))
        .orderBy(desc(collections.collectedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(collections),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/collections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wasteLogId = parseInt(body.wasteLogId);

    // Check if already collected
    const existing = await db
      .select()
      .from(collections)
      .where(eq(collections.wasteLogId, wasteLogId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This waste has already been collected" },
        { status: 400 }
      );
    }

    // Create collection record
    const result = await db
      .insert(collections)
      .values({
        wasteLogId,
        collectorId: body.collectorId || null,
        collectorName: body.collectorName || "Unknown Collector",
        vehicleNumber: body.vehicleNumber || null,
        notes: body.notes || null,
        gpsLat: body.gpsLat || null,
        gpsLng: body.gpsLng || null,
      })
      .returning();

    // Update waste log with collection time
    await db
      .update(wasteLogs)
      .set({ collectedAt: new Date() })
      .where(eq(wasteLogs.id, wasteLogId));

    // Resolve any overdue alerts for this waste
    await db
      .update(alerts)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(alerts.wasteLogId, wasteLogId));

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/collections error:", error);
    return NextResponse.json(
      { error: "Failed to record collection" },
      { status: 400 }
    );
  }
}
