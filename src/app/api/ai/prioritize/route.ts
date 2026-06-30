import { NextResponse } from "next/server";
import { analyzeTaskRiskAndPriority } from "@/lib/gemini/prompts";

export async function POST(req: Request) {
  try {
    const { title, deadline, estimatedDuration, pendingCount } = await req.json();
    if (!title || !deadline) {
      return NextResponse.json(
        { error: "Title and deadline are required" },
        { status: 400 }
      );
    }
    const result = await analyzeTaskRiskAndPriority(
      title,
      deadline,
      estimatedDuration || 1,
      pendingCount || 0
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API prioritize error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to prioritize task" },
      { status: 500 }
    );
  }
}
