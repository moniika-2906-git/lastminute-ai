import { NextResponse } from "next/server";
import { parseSmartTask } from "@/lib/gemini/prompts";

export async function POST(req: Request) {
  try {
    const { text, currentTime } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    const result = await parseSmartTask(text, currentTime || new Date().toISOString());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API smart-task error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse task" },
      { status: 500 }
    );
  }
}
export const runtime = 'nodejs'; // Use nodejs environment
