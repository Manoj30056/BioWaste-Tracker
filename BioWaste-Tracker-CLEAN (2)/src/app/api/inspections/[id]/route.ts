import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, facilities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db
      .select({
        id: inspections.id,
        facilityId: inspections.facilityId,
        facilityName: facilities.name,
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
      .leftJoin(facilities, eq(inspections.facilityId, facilities.id))
      .where(eq(inspections.id, parseInt(id)));
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.overallScore !== undefined)
      updateData.overallScore = parseInt(body.overallScore);
    if (body.segregationScore !== undefined)
      updateData.segregationScore = parseInt(body.segregationScore);
    if (body.storageScore !== undefined)
      updateData.storageScore = parseInt(body.storageScore);
    if (body.documentationScore !== undefined)
      updateData.documentationScore = parseInt(body.documentationScore);
    if (body.trainingScore !== undefined)
      updateData.trainingScore = parseInt(body.trainingScore);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status === "completed")
      updateData.completedDate = new Date();

    const result = await db
      .update(inspections)
      .set(updateData)
      .where(eq(inspections.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 400 }
    );
  }
}
