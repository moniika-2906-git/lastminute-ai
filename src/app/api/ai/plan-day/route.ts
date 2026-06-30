import { NextResponse } from "next/server";
import { generateMorningPlan } from "@/lib/gemini/prompts";

export async function POST(req: Request) {
  try {
    const { tasks, habits } = await req.json();
    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Tasks array is required" },
        { status: 400 }
      );
    }
    const result = await generateMorningPlan(tasks, habits || []);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API plan-day error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate morning plan" },
      { status: 500 }
    );
  }
}
