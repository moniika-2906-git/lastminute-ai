import { NextResponse } from "next/server";
import { generateMotivationalQuote } from "@/lib/gemini/prompts";

export async function GET() {
  try {
    const result = await generateMotivationalQuote();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API quote error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quote" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic'; // Prevent static pre-rendering
