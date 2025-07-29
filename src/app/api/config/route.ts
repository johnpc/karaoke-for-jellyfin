import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/config";

export async function GET() {
  try {
    const config = getServerConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error getting server config:", error);
    return NextResponse.json(
      { error: "Failed to get configuration" },
      { status: 500 }
    );
  }
}
