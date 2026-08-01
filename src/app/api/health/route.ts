import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ 
      status: "ok", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Database connection error:", error.message);
    return NextResponse.json(
      { 
        status: "error", 
        database: "disconnected",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
