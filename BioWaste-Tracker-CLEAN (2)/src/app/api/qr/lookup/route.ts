import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wasteLogs, facilities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let wasteId: number | null = null;

    // Try parsing the QR data
    try {
      const qrPayload = JSON.parse(body.qrData);
      // Extract ID from tracking ID like "BWM-000042"
      if (qrPayload.id && typeof qrPayload.id === "string") {
        const match = qrPayload.id.match(/BWM-(\d+)/);
        if (match) {
          wasteId = parseInt(match[1]!, 10);
        }
      }
    } catch {
      // If JSON parse fails, try direct tracking ID
      const raw = body.qrData as string;
      const match = raw.match(/BWM-(\d+)/);
      if (match) {
        wasteId = parseInt(match[1]!, 10);
      }
    }

    if (!wasteId) {
      return NextResponse.json(
        { error: "Invalid QR code. Not a BioWaste tracking label." },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        id: wasteLogs.id,
        facilityId: wasteLogs.facilityId,
        facilityName: facilities.name,
        facilityType: facilities.type,
        facilityLicense: facilities.licenseNumber,
        facilityCity: facilities.city,
        facilityState: facilities.state,
        complianceStatus: facilities.complianceStatus,
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
      .leftJoin(facilities, eq(wasteLogs.facilityId, facilities.id))
      .where(eq(wasteLogs.id, wasteId));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Waste log not found for this QR code." },
        { status: 404 }
      );
    }

    const log = result[0]!;

    const categoryInfo: Record<string, { label: string; color: string; icon: string; hazard: string }> = {
      yellow: { label: "Yellow - Infectious / Pathological", color: "#fbbf24", icon: "🟡", hazard: "HIGH" },
      red: { label: "Red - Contaminated Recyclable", color: "#ef4444", icon: "🔴", hazard: "HIGH" },
      blue: { label: "Blue - Glassware Waste", color: "#3b82f6", icon: "🔵", hazard: "MEDIUM" },
      white: { label: "White - Sharps", color: "#94a3b8", icon: "⚪", hazard: "HIGH" },
      cytotoxic: { label: "Cytotoxic - Drug Waste", color: "#a855f7", icon: "🟣", hazard: "CRITICAL" },
      chemical: { label: "Chemical Waste", color: "#f97316", icon: "🟠", hazard: "CRITICAL" },
      general: { label: "General - Non-hazardous", color: "#22c55e", icon: "🟢", hazard: "LOW" },
    };

    const catInfo = categoryInfo[log.category] || { label: log.category, color: "#6b7280", icon: "⚫", hazard: "UNKNOWN" };

    return NextResponse.json({
      found: true,
      trackingId: `BWM-${String(log.id).padStart(6, "0")}`,
      category: {
        code: log.category,
        label: catInfo.label,
        color: catInfo.color,
        icon: catInfo.icon,
        hazardLevel: catInfo.hazard,
      },
      weight: {
        kg: parseFloat(log.quantityKg),
        display: `${parseFloat(log.quantityKg).toFixed(3)} kg`,
      },
      facility: {
        name: log.facilityName,
        type: log.facilityType,
        license: log.facilityLicense,
        location: `${log.facilityCity}, ${log.facilityState}`,
        complianceStatus: log.complianceStatus,
      },
      disposal: {
        method: log.disposalMethod || "Pending",
        handler: log.handlerName || "Unassigned",
        manifest: log.manifestNumber || "N/A",
        storage: log.storageLocation || "N/A",
      },
      timestamps: {
        logged: log.createdAt,
        collected: log.collectedAt,
      },
      description: log.description,
    });
  } catch (error) {
    console.error("QR lookup error:", error);
    return NextResponse.json(
      { error: "Failed to process QR code" },
      { status: 500 }
    );
  }
}
