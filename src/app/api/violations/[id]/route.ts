import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { violations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.isResolved !== undefined) {
      updateData.isResolved = body.isResolved;
      if (body.isResolved) updateData.resolvedAt = new Date();
    }
    if (body.correctiveAction !== undefined)
      updateData.correctiveAction = body.correctiveAction;
    if (body.deadline !== undefined)
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.fineAmount !== undefined)
      updateData.fineAmount = body.fineAmount
        ? body.fineAmount.toString()
        : null;

    const result = await db
      .update(violations)
      .set(updateData)
      .where(eq(violations.id, parseInt(id)))
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
