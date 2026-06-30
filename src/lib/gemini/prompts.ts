import { ai, GEMINI_MODEL, isGeminiConfigured } from "./config";

// Interface helper to clean up json codeblocks if returned by AI
function cleanJSONResponse(text: string): string {
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.substring(7);
  } else if (clean.startsWith("```")) {
    clean = clean.substring(3);
  }
  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3);
  }
  return clean.trim();
}

/**
 * 1. AI SMART TASK PARSER
 * Parses natural language into task fields.
 */
export async function parseSmartTask(userInput: string, currentTime: string) {
  if (!isGeminiConfigured) {
    // Fallback Mock Data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);

    return {
      title: userInput.replace(/remind me to |i have |due /gi, "").trim() || "New Smart Task",
      category: userInput.toLowerCase().includes("assignment") || userInput.toLowerCase().includes("study") ? "Study" : "Personal",
      priority: userInput.toLowerCase().includes("tomorrow") || userInput.toLowerCase().includes("urgent") ? "high" : "medium",
      difficulty: "medium",
      deadline: tomorrow.toISOString(),
      estimatedDuration: 2,
      subtasks: [
        { title: "Review requirements", completed: false },
        { title: "Draft first version", completed: false },
        { title: "Submit and double check", completed: false }
      ],
      suggestedSchedule: "14:00 - 16:00",
      riskAnalysis: {
        riskScore: 40,
        warningText: "Starting early avoids late submission rush.",
        suggestions: ["Allocate 2 hours tomorrow afternoon", "Review prompt criteria first"]
      }
    };
  }

  const prompt = `
  You are an expert task parsing agent.
  Analyze the following user statement and extract a structured task.
  Current Time Context: ${currentTime}

  User Input: "${userInput}"

  Return a JSON object conforming exactly to this schema:
  {
    "title": "Task name (concise, clear)",
    "category": "One of: Work | Study | Personal | Fitness | Bills | Other",
    "priority": "One of: critical | high | medium | low",
    "difficulty": "One of: easy | medium | hard",
    "deadline": "ISO-8601 string representing the deadline. Resolve relative terms like 'tomorrow', 'next Friday', 'tonight' relative to the current time.",
    "estimatedDuration": number (estimated hours required, e.g., 1.5, 0.5, 3.0),
    "subtasks": [
      { "title": "Subtask title 1", "completed": false },
      { "title": "Subtask title 2", "completed": false }
    ],
    "suggestedSchedule": "Suggested time block (format HH:MM - HH:MM) to work on this, ideally between 08:00 and 22:00."
  }
  
  Do not explain. Return ONLY the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    return JSON.parse(cleanJSONResponse(text));
  } catch (error) {
    console.error("Gemini parseSmartTask error:", error);
    throw error;
  }
}

/**
 * 2. INTELLIGENT PRIORITIZATION & RISK PREDICTION
 */
export async function analyzeTaskRiskAndPriority(taskTitle: string, deadline: string, estimatedDuration: number, pendingCount: number) {
  if (!isGeminiConfigured) {
    const risk = new Date(deadline).getTime() - new Date().getTime() < 86400000 * 2 ? 80 : 30;
    return {
      priority: risk > 70 ? "critical" : "medium",
      riskScore: risk,
      warningText: risk > 70 ? "High risk of missing the deadline due to close proximity." : "Healthy buffer window remaining.",
      suggestions: risk > 70 
        ? ["Begin first subtask immediately.", "Reschedule non-urgent tasks.", "Set an alarm for tonight."] 
        : ["Prepare materials today.", "Schedule a 1-hour block tomorrow."]
    };
  }

  const prompt = `
  Analyze this task for priority and completion risk:
  Task: "${taskTitle}"
  Deadline: ${deadline}
  Estimated Duration: ${estimatedDuration} hours
  Current Time: ${new Date().toISOString()}
  Pending Tasks already in queue: ${pendingCount}

  Calculate:
  1. Priority level (critical, high, medium, low) based on urgency and estimated effort.
  2. Risk score (0 to 100) representing probability of missing the deadline.
  3. Actionable warnings and mitigation suggestions.

  Return a JSON object conforming exactly to this schema:
  {
    "priority": "critical | high | medium | low",
    "riskScore": number (0-100),
    "warningText": "Short text summary of the risk situation",
    "suggestions": ["suggestion 1", "suggestion 2"]
  }
  Do not explain. Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    return JSON.parse(cleanJSONResponse(text));
  } catch (error) {
    console.error("Gemini analyzeTaskRiskAndPriority error:", error);
    throw error;
  }
}

/**
 * 3. AI DAILY SCHEDULER
 * Creates time blocks for the day.
 */
export async function generateDailySchedule(tasks: any[], dateStr: string) {
  if (!isGeminiConfigured) {
    return {
      timeBlocks: tasks.slice(0, 3).map((t, idx) => {
        const start = 9 + idx * 3;
        const end = start + Math.ceil(t.estimatedDuration || 1);
        return {
          id: `block_${idx}`,
          taskId: t.id,
          title: t.title,
          startTime: `${String(start).padStart(2, "0")}:00`,
          endTime: `${String(end).padStart(2, "0")}:00`,
          color: idx === 0 ? "rose" : idx === 1 ? "violet" : "cyan"
        };
      })
    };
  }

  const tasksJson = JSON.stringify(tasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    duration: t.estimatedDuration || 1,
    deadline: t.deadline
  })));

  const prompt = `
  You are an expert time-management coordinator.
  Generate an optimized daily schedule for date: ${dateStr}.
  Available Tasks to Schedule:
  ${tasksJson}

  Schedule tasks throughout the day between 08:00 and 22:00.
  Insert breaks (e.g., "15-minute screen break" or "Lunch break") where appropriate.
  Give higher priority and earlier time slots to "critical" and "high" priority tasks.

  Return a JSON object conforming exactly to this schema:
  {
    "timeBlocks": [
      {
        "id": "block_unique_id",
        "taskId": "task_id_if_linked_otherwise_null",
        "title": "Task title or Break description",
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "color": "Tailwind color name: e.g. rose, violet, cyan, emerald, amber, slate"
      }
    ]
  }
  Do not explain. Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    return JSON.parse(cleanJSONResponse(text));
  } catch (error) {
    console.error("Gemini generateDailySchedule error:", error);
    throw error;
  }
}

/**
 * 4. CONTEXT AWARE REMINDER GENERATOR
 */
export async function generateContextReminder(taskTitle: string, deadline: string, duration: number) {
  if (!isGeminiConfigured) {
    return {
      reminder: `Your task "${taskTitle}" is due soon. It takes about ${duration} hours, so getting started now ensures you complete it stress-free!`
    };
  }

  const prompt = `
  Generate a context-aware, highly motivational, and helpful reminder message for the user.
  Task: "${taskTitle}"
  Deadline: ${deadline}
  Estimated Duration: ${duration} hours
  Current Time: ${new Date().toISOString()}

  Instead of a generic "You have an assignment," explain why starting now is smart (e.g., based on duration and remaining time). Keep it under 2 sentences, supportive, and firm.

  Return a JSON object conforming exactly to this schema:
  {
    "reminder": "The generated motivational reminder message"
  }
  Do not explain. Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    return JSON.parse(cleanJSONResponse(text));
  } catch (error) {
    console.error("Gemini generateContextReminder error:", error);
    throw error;
  }
}

/**
 * 5. PRODUCTIVITY COACH CHAT
 */
export async function runCoachChat(history: { role: 'user' | 'model', text: string }[], activeTasks: any[], activeGoals: any[]) {
  if (!isGeminiConfigured) {
    const lastMsg = history[history.length - 1]?.text || "";
    let reply = "I'm here as your AI Productivity Coach. Let's tackle your priorities! ";
    if (lastMsg.toLowerCase().includes("stress")) {
      reply += "Take a deep breath. Focus on your top task first. Let's break it down into 15-minute subtasks.";
    } else if (activeTasks.length > 0) {
      reply += `Currently, you have ${activeTasks.length} pending tasks. I recommend focusing on "${activeTasks[0].title}" first. What is blocking you from starting?`;
    } else {
      reply += "You are all caught up! Ready to set a new goal?";
    }
    return { reply };
  }

  const taskContext = activeTasks.map(t => `- ${t.title} (${t.priority} priority, deadline: ${t.deadline}, progress: ${t.subtasks.filter((s: any) => s.completed).length}/${t.subtasks.length} subtasks)`).join("\n");
  const goalContext = activeGoals.map(g => `- ${g.title}: progress ${g.currentValue}/${g.targetValue} ${g.unit}`).join("\n");

  const formattedHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const systemInstruction = `
  You are an elite productivity coach in the "LastMinute AI" app.
  Your tone is encouraging, practical, slightly witty, and highly outcome-oriented.
  You help users beat procrastination, reduce stress, and optimize their schedule.
  
  You have full access to the user's current productivity context:
  ACTIVE TASKS:
  ${taskContext || "No active tasks."}
  
  ACTIVE GOALS:
  ${goalContext || "No active goals."}

  Keep responses concise (1-3 paragraphs max), actionable, and deeply integrated with their actual list. If a user asks "what should I do now?", guide them specifically using their task list, preferring high priority and low difficulty/short duration tasks to build momentum!
  `;

  try {
    // We add the system context to the start of the session or chat request
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: "Understood. I will coach the user based on their context." }] },
        ...formattedHistory
      ],
    });
    return {
      reply: response.text || "I'm analyzing your progress. Let's focus on completing one task at a time."
    };
  } catch (error) {
    console.error("Gemini runCoachChat error:", error);
    throw error;
  }
}

/**
 * 6. AI DAILY PLANNING (Morning strategy)
 */
export async function generateMorningPlan(tasks: any[], habits: any[]) {
  if (!isGeminiConfigured) {
    return {
      todayActionPlan: "Today is about gaining momentum. We will target your key assignments early.",
      topPriorities: tasks.slice(0, 3).map(t => t.title) || ["Complete Daily Habits"],
      suggestedBreaks: "Take a 5-minute break every 25 minutes (Pomodoro technique). Longer 20-minute break after lunch.",
      studyStrategy: "Focus deep work blocks between 9 AM and 12 PM when your cognitive load is freshest.",
      tips: [
        "Drink a full glass of water before starting.",
        "Put your phone in another room during study blocks.",
        "Check off your easy subtasks first to build dopamine."
      ]
    };
  }

  const tasksJson = JSON.stringify(tasks.map(t => ({ title: t.title, priority: t.priority, duration: t.estimatedDuration })));
  const habitsJson = JSON.stringify(habits.map(h => h.name));

  const prompt = `
  You are a morning productivity architect.
  Generate today's morning action plan for the user based on their tasks and habits:
  Tasks: ${tasksJson}
  Habits: ${habitsJson}

  Create an encouraging, structured morning brief.
  Return a JSON object conforming exactly to this schema:
  {
    "todayActionPlan": "A text summary summarizing the core focus of today",
    "topPriorities": ["Priority 1", "Priority 2", "Priority 3"],
    "suggestedBreaks": "Specific advice on break intervals",
    "studyStrategy": "Strategic advice on when and how to study",
    "tips": ["Tip 1", "Tip 2", "Tip 3"]
  }
  Do not explain. Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    return JSON.parse(cleanJSONResponse(text));
  } catch (error) {
    console.error("Gemini generateMorningPlan error:", error);
    throw error;
  }
}

/**
 * 7. EVENING REFLECTION
 */
export async function generateReflectionAnalysis(reflectionAnswers: { completed: string[], missed: { title: string, reason: string }[], reviewText: string }) {
  if (!isGeminiConfigured) {
    return {
      summary: "You did well in making progress today. Missing a task is just feedback for tomorrow's schedule.",
      tomorrowStrategy: "We will allocate larger time buffers for tasks that took longer than expected today.",
      xpReward: 30,
      tipsForTomorrow: [
        "Plan for interruptions by scheduling 20% buffer time.",
        "Tackle the missed item first thing in the morning."
      ]
    };
  }

  const prompt = `
  Analyze the user's evening reflection log:
  Completed Tasks: ${JSON.stringify(reflectionAnswers.completed)}
  Missed Tasks & Reasons: ${JSON.stringify(reflectionAnswers.missed)}
  User's Journal/Notes: "${reflectionAnswers.reviewText}"

  Offer a constructive, coaching analysis.
  - Compute a fair XP reward (between 10 and 50) based on their reflection depth.
  - Propose adjustments to tomorrow's schedule to prevent future misses.

  Return a JSON object conforming exactly to this schema:
  {
    "summary": "Coaching summary of their daily achievement and growth",
    "tomorrowStrategy": "Strategic adjustment for tomorrow (e.g. increase buffers, shift study hours)",
    "xpReward": number (10 to 50),
    "tipsForTomorrow": ["Specific tip 1", "Specific tip 2"]
  }
  Do not explain. Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    return JSON.parse(cleanJSONResponse(text));
  } catch (error) {
    console.error("Gemini generateReflectionAnalysis error:", error);
    throw error;
  }
}

/**
 * 8. GEMINI MOTIVATIONAL QUOTE GENERATOR
 */
export async function generateMotivationalQuote() {
  if (!isGeminiConfigured) {
    return {
      quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
      author: "Chinese Proverb"
    };
  }

  const prompt = `
  Generate a unique, powerful, modern productivity motivational quote. Avoid clichés like "Just do it".
  Focus on the theme of starting now, the illusion of "last minute" panic, and taking small steps.
  
  Return a JSON object conforming exactly to this schema:
  {
    "quote": "The quote text",
    "author": "The author name"
  }
  Do not explain. Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text || "";
    return JSON.parse(cleanJSONResponse(text));
  } catch (error) {
    console.error("Gemini generateMotivationalQuote error:", error);
    return {
      quote: "Action is the foundational key to all success.",
      author: "Pablo Picasso"
    };
  }
}
