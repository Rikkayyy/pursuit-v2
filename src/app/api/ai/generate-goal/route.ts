import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/api/subscriptions";
import { incrementAndCheckAiUsage, DAILY_AI_GENERATION_LIMIT } from "@/lib/api/ai-usage";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a goal planning assistant for Pursuit, a goal-tracking app based on the GPS method (Goal, Plan, System).

When a user describes a goal, generate a structured plan with milestones and daily/weekly tasks.

You MUST respond with ONLY valid JSON in this exact format, no other text:

{
  "title": "Clear, concise goal title",
  "description": "1-2 sentence description of the goal and why it matters",
  "milestones": [
    { "title": "Milestone 1 — a measurable checkpoint" },
    { "title": "Milestone 2 — ordered by progression" }
  ],
  "tasks": [
    { "title": "Daily or weekly task", "type": "recurring", "frequency": "daily" },
    { "title": "Another task", "type": "recurring", "frequency": "weekly" },
    { "title": "A one-time setup task", "type": "one_time", "frequency": "daily" }
  ]
}

Rules:
- Generate 3-6 milestones ordered from earliest to latest
- Generate 3-6 tasks, mostly recurring (daily or weekly)
- Include 1-2 one-time tasks if setup steps are needed
- Milestones should be measurable and progressively harder
- Tasks should be specific and actionable with realistic time commitments
- Tailor everything to the user's context (timeline, experience, availability)
- Keep task titles concise — start with a verb`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isSubscriptionActive(supabase, user.id))) {
      return NextResponse.json({ error: "AI goal planning requires Pursuit Pro" }, { status: 403 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { allowed } = await incrementAndCheckAiUsage(adminClient, user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: `You've reached today's limit of ${DAILY_AI_GENERATION_LIMIT} AI generations. Try again tomorrow.` },
        { status: 429 }
      );
    }

    const { goalDescription, timeline, experience, dailyTime, constraints } =
      await req.json();

    if (!goalDescription) {
      return NextResponse.json(
        { error: "Goal description is required" },
        { status: 400 }
      );
    }

    const userMessage = [
      `Goal: ${goalDescription}`,
      timeline ? `Timeline: ${timeline}` : "",
      experience ? `Current experience: ${experience}` : "",
      dailyTime ? `Daily time available: ${dailyTime}` : "",
      constraints ? `Constraints or notes: ${constraints}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const clean = text.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(clean);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate goal plan. Please try again." },
      { status: 500 }
    );
  }
}