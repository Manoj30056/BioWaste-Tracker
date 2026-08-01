import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wasteLogs, facilities } from "@/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select({
        id: wasteLogs.id,
        facilityId: wasteLogs.facilityId,
        facilityName: facilities.name,
        facilityLicense: facilities.licenseNumber,
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
      .where(eq(wasteLogs.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json({ error: "Waste log not found" }, { status: 404 });
    }

    const log = result[0]!;

    const categoryLabels: Record<string, string> = {
      yellow: "YELLOW - Infectious/Pathological",
      red: "RED - Contaminated Recyclable",
      blue: "BLUE - Glassware Waste",
      white: "WHITE - Sharps",
      cytotoxic: "CYTOTOXIC - Drug Waste",
      chemical: "CHEMICAL - Chemical Waste",
      general: "GENERAL - Non-hazardous",
    };

    // QR Data payload
    const qrData = JSON.stringify({
      id: `BWM-${String(log.id).padStart(6, "0")}`,
      facility: log.facilityName,
      license: log.facilityLicense,
      category: categoryLabels[log.category] || log.category,
      weight: `${parseFloat(log.quantityKg).toFixed(3)} kg`,
      disposal: log.disposalMethod || "Pending",
      handler: log.handlerName || "Unassigned",
      manifest: log.manifestNumber || "N/A",
      storage: log.storageLocation || "N/A",
      date: log.createdAt ? new Date(log.createdAt).toISOString() : "N/A",
      collected: log.collectedAt ? new Date(log.collectedAt).toISOString() : "Pending",
    });

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });

    return NextResponse.json({
      qrCode: qrDataUrl,
      wasteLog: {
        ...log,
        trackingId: `BWM-${String(log.id).padStart(6, "0")}`,
        categoryLabel: categoryLabels[log.category] || log.category,
      },
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
