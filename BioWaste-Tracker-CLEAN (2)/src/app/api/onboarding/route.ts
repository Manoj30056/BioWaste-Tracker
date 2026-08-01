import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { facilities, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Create the facility
    const facilityResult = await db
      .insert(facilities)
      .values({
        name: body.facilityName,
        type: body.facilityType as "clinic" | "nursing_home" | "lab" | "dental" | "veterinary" | "other",
        licenseNumber: body.licenseNumber,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        contactPerson: body.contactPerson,
        contactPhone: body.contactPhone,
        bedCount: body.bedCount ? parseInt(body.bedCount) : null,
        ownerId: session.user.id,
        complianceStatus: "pending_review",
      })
      .returning();

    const newFacility = facilityResult[0];
    if (!newFacility) {
      return NextResponse.json({ error: "Failed to create facility" }, { status: 500 });
    }

    // Update the user with facility ID and mark as needing approval
    await db
      .update(users)
      .set({
        facilityId: newFacility.id,
        role: "facility_manager",
        isApproved: false, // Admin needs to approve
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      facility: newFacility,
    });
  } catch (error: unknown) {
    console.error("Onboarding error:", error);
    const msg = error instanceof Error && error.message.includes("unique")
      ? "License number already exists"
      : "Failed to complete onboarding";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
