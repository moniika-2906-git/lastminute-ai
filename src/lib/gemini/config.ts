import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. Google Gemini API features will fail or fall back to mock modes.");
}

// We instantiate the official SDK. Note that we handle missing keys gracefully in endpoints.
export const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY",
});
export const isGeminiConfigured = !!apiKey;
export const GEMINI_MODEL = "gemini-2.5-flash"; // Standard fast model
