import { NextResponse } from "next/server";
import { generateDailySchedule } from "@/lib/gemini/prompts";

export async function POST(req: Request) {
  try {
    const { tasks, date } = await req.json();
    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Tasks array is required" },
        { status: 400 }
      );
    }
    const result = await generateDailySchedule(tasks, date || new Date().toISOString().split('T')[0]);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API scheduler error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate schedule" },
      { status: 500 }
    );
  }
}
