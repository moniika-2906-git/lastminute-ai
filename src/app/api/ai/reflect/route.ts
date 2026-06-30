import { NextResponse } from "next/server";
import { generateReflectionAnalysis } from "@/lib/gemini/prompts";

export async function POST(req: Request) {
  try {
    const { completed, missed, reviewText } = await req.json();
    if (!completed || !Array.isArray(completed) || !missed || !Array.isArray(missed)) {
      return NextResponse.json(
        { error: "Completed and missed task details are required" },
        { status: 400 }
      );
    }
    const result = await generateReflectionAnalysis({
      completed,
      missed,
      reviewText: reviewText || ""
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API reflect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze reflection" },
      { status: 500 }
    );
  }
}
