import { NextResponse } from "next/server";
import { runAutonomousAgentCycleAction } from "@/lib/actions/automation";

/**
 * Headless Autonomous Prospecting Agent Endpoint
 * Can be triggered headlessly by external cron jobs, webhooks, or scheduled agents.
 * 
 * Pipeline:
 * 1. Checks pending keywords; if queue is empty, generates fresh territory queries.
 * 2. Queries Google Places API (New) for commercial businesses.
 * 3. Detects website presence (flags no-website gold targets).
 * 4. Scouts verified executive decision-makers.
 * 5. Ingests prospects directly into CRM pipeline.
 */
export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const { country, state, city, niche, modelId } = body;

    const result = await runAutonomousAgentCycleAction({
      country,
      state,
      city,
      niche,
      modelId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Headless Agent Execution Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await runAutonomousAgentCycleAction();
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
