import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    
    if (body.status === "acknowledged") {
      updateData.status = "acknowledged";
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedBy = body.acknowledgedBy || null;
    } else if (body.status === "resolved") {
      updateData.status = "resolved";
      updateData.resolvedAt = new Date();
    }

    const result = await db
      .update(alerts)
      .set(updateData)
      .where(eq(alerts.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("PUT /api/alerts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
