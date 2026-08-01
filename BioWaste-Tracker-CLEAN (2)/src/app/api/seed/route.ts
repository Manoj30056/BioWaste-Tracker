import { NextResponse } from "next/server";
import { db } from "@/db";
import { facilities, wasteLogs, inspections, violations, alerts, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Seed demo users
    const demoUsers = [
      { name: "Admin User", email: "admin@biowaste.com", password: "admin123", role: "admin" as const },
      { name: "Inspector Singh", email: "inspector@biowaste.com", password: "inspect123", role: "inspector" as const },
      { name: "Facility Manager", email: "manager@biowaste.com", password: "manage123", role: "facility_manager" as const },
      { name: "Collector Raj", email: "collector@biowaste.com", password: "collect123", role: "collector" as const },
    ];

    for (const demoUser of demoUsers) {
      const existing = await db.select().from(users).where(eq(users.email, demoUser.email)).limit(1);
      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash(demoUser.password, 12);
        await db.insert(users).values({
          name: demoUser.name,
          email: demoUser.email,
          password: hashedPassword,
          role: demoUser.role,
          isApproved: true,
        });
      }
    }

    // Seed facilities
    const facilityData = await db
      .insert(facilities)
      .values([
        {
          name: "City Care Clinic",
          type: "clinic",
          licenseNumber: "CLC-2024-001",
          address: "123 Main Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          contactPerson: "Dr. Priya Sharma",
          contactPhone: "+91-9876543210",
          contactEmail: "priya@citycareclinic.com",
          bedCount: 15,
          complianceStatus: "compliant",
        },
        {
          name: "Sunrise Nursing Home",
          type: "nursing_home",
          licenseNumber: "SNH-2024-002",
          address: "456 Oak Avenue",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          contactPerson: "Rajesh Kumar",
          contactPhone: "+91-9876543211",
          contactEmail: "rajesh@sunrisenursing.com",
          bedCount: 30,
          complianceStatus: "non_compliant",
        },
        {
          name: "Green Valley Dental",
          type: "dental",
          licenseNumber: "GVD-2024-003",
          address: "789 Elm Road",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
          contactPerson: "Dr. Anita Patel",
          contactPhone: "+91-9876543212",
          contactEmail: "anita@greenvalleydental.com",
          bedCount: 5,
          complianceStatus: "compliant",
        },
        {
          name: "MedLab Diagnostics",
          type: "lab",
          licenseNumber: "MLD-2024-004",
          address: "101 Lab Complex",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600001",
          contactPerson: "Dr. Suresh Iyer",
          contactPhone: "+91-9876543213",
          contactEmail: "suresh@medlabdiag.com",
          bedCount: null,
          complianceStatus: "pending_review",
        },
        {
          name: "Hope Clinic",
          type: "clinic",
          licenseNumber: "HPC-2024-005",
          address: "222 Park Street",
          city: "Kolkata",
          state: "West Bengal",
          pincode: "700001",
          contactPerson: "Dr. Amit Roy",
          contactPhone: "+91-9876543214",
          contactEmail: "amit@hopeclinic.com",
          bedCount: 10,
          complianceStatus: "compliant",
        },
        {
          name: "Care Plus Nursing Home",
          type: "nursing_home",
          licenseNumber: "CPN-2024-006",
          address: "55 River Road",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411001",
          contactPerson: "Dr. Meena Kulkarni",
          contactPhone: "+91-9876543215",
          contactEmail: "meena@careplus.com",
          bedCount: 25,
          complianceStatus: "suspended",
        },
      ])
      .returning();

    // Seed waste logs
    const wasteData = [];
    const categories = [
      "yellow",
      "red",
      "blue",
      "white",
      "cytotoxic",
      "chemical",
      "general",
    ] as const;
    const methods = [
      "Incineration",
      "Autoclaving",
      "Chemical Treatment",
      "Deep Burial",
      "Shredding",
    ];

    for (const facility of facilityData) {
      for (let i = 0; i < 8; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)]!;
        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        wasteData.push({
          facilityId: facility.id,
          category: cat,
          quantityKg: (Math.random() * 20 + 0.5).toFixed(3),
          description: `${cat} category waste from ${facility.name}`,
          disposalMethod:
            methods[Math.floor(Math.random() * methods.length)]!,
          handlerName: `Handler ${Math.floor(Math.random() * 5) + 1}`,
          manifestNumber: `MN-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`,
          storageLocation: `Storage Room ${
            Math.floor(Math.random() * 3) + 1
          }`,
          collectedAt: date,
          createdAt: date,
        });
      }
    }

    await db.insert(wasteLogs).values(wasteData);

    // Seed inspections
    const inspectionData = [];
    const statuses = [
      "completed",
      "completed",
      "scheduled",
      "in_progress",
    ] as const;

    for (const facility of facilityData) {
      for (let i = 0; i < 3; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const status = statuses[Math.floor(Math.random() * statuses.length)]!;
        const isSpotCheck = Math.random() > 0.5;
        const score =
          status === "completed"
            ? Math.floor(Math.random() * 40) + 60
            : null;

        inspectionData.push({
          facilityId: facility.id,
          status,
          scheduledDate: date,
          completedDate: status === "completed" ? date : null,
          isSpotCheck,
          overallScore: score,
          segregationScore: score
            ? Math.floor(Math.random() * 40) + 60
            : null,
          storageScore: score
            ? Math.floor(Math.random() * 40) + 60
            : null,
          documentationScore: score
            ? Math.floor(Math.random() * 40) + 60
            : null,
          trainingScore: score
            ? Math.floor(Math.random() * 40) + 60
            : null,
          notes: isSpotCheck
            ? "Unannounced spot-check inspection"
            : "Scheduled routine inspection",
          createdAt: date,
        });
      }
    }

    const inspectionResult = await db
      .insert(inspections)
      .values(inspectionData)
      .returning();

    // Seed violations
    const violationData = [];
    const severities = ["minor", "major", "critical"] as const;
    const violationCategories = [
      "Improper Segregation",
      "Missing Labels",
      "Overdue Collection",
      "Training Lapse",
      "Storage Violation",
      "Documentation Missing",
      "PPE Non-compliance",
      "Expired Manifest",
    ];

    const completedInspections = inspectionResult.filter(
      (i) => i.status === "completed"
    );

    for (const insp of completedInspections) {
      const numViolations = Math.floor(Math.random() * 3);
      for (let i = 0; i < numViolations; i++) {
        const sev =
          severities[Math.floor(Math.random() * severities.length)]!;
        const deadline = new Date();
        deadline.setDate(
          deadline.getDate() + Math.floor(Math.random() * 30) + 7
        );
        const isResolved = Math.random() > 0.5;

        violationData.push({
          inspectionId: insp.id,
          facilityId: insp.facilityId,
          severity: sev,
          category:
            violationCategories[
              Math.floor(Math.random() * violationCategories.length)
            ]!,
          description: `Violation found during inspection at facility`,
          correctiveAction: isResolved
            ? "Corrective action taken and verified"
            : "Pending corrective action",
          deadline,
          isResolved,
          resolvedAt: isResolved ? new Date() : null,
          fineAmount: sev === "critical"
            ? "5000.00"
            : sev === "major"
            ? "2000.00"
            : "500.00",
        });
      }
    }

    if (violationData.length > 0) {
      await db.insert(violations).values(violationData);
    }

    return NextResponse.json({
      success: true,
      seeded: {
        facilities: facilityData.length,
        wasteLogs: wasteData.length,
        inspections: inspectionData.length,
        violations: violationData.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}
