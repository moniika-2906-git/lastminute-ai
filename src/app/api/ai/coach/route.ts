import { NextResponse } from "next/server";
import { runCoachChat } from "@/lib/gemini/prompts";

export async function POST(req: Request) {
  try {
    const { history, activeTasks, activeGoals } = await req.json();
    if (!history || !Array.isArray(history)) {
      return NextResponse.json(
        { error: "Chat history array is required" },
        { status: 400 }
      );
    }
    const result = await runCoachChat(
      history,
      activeTasks || [],
      activeGoals || []
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API coach error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile response" },
      { status: 500 }
    );
  }
}
