import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { facilities } from "@/db/schema";
import { eq, desc, ilike, or, sql, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = db.select().from(facilities);

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(facilities.name, `%${search}%`),
          ilike(facilities.licenseNumber, `%${search}%`),
          ilike(facilities.city, `%${search}%`)
        )
      );
    }
    if (status) {
      conditions.push(
        eq(
          facilities.complianceStatus,
          status as "compliant" | "non_compliant" | "pending_review" | "suspended"
        )
      );
    }

    const whereClause =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]!
          : sql`${conditions[0]} AND ${conditions[1]}`
        : undefined;

    const [data, totalResult] = await Promise.all([
      whereClause
        ? query
            .where(whereClause)
            .orderBy(desc(facilities.createdAt))
            .limit(limit)
            .offset(offset)
        : query.orderBy(desc(facilities.createdAt)).limit(limit).offset(offset),
      whereClause
        ? db.select({ count: count() }).from(facilities).where(whereClause)
        : db.select({ count: count() }).from(facilities),
    ]);

    return NextResponse.json({
      data,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/facilities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facilities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db
      .insert(facilities)
      .values({
        name: body.name,
        type: body.type,
        licenseNumber: body.licenseNumber,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        contactPerson: body.contactPerson,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail || null,
        bedCount: body.bedCount ? parseInt(body.bedCount) : null,
        complianceStatus: body.complianceStatus || "pending_review",
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/facilities error:", error);
    const msg =
      error instanceof Error &&
      error.message.includes("unique")
        ? "License number already exists"
        : "Failed to create facility";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
