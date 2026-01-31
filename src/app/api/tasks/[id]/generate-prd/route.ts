import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const ANALYSIS_SYSTEM_PROMPT = `You are an expert product manager helping to create PRDs (Product Requirements Documents).

When given context about a feature or task, you analyze it and:
1. Identify what's clear vs ambiguous
2. Generate 2-4 targeted clarifying questions to fill gaps
3. Keep questions concise and actionable

Respond in JSON format:
{
  "summary": "Brief 1-sentence summary of what you understood",
  "questions": ["Question 1?", "Question 2?", ...]
}

Focus on questions about:
- Scope boundaries (what's in/out)
- User needs and pain points
- Technical constraints
- Success criteria
- Timeline/priority`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { context } = body;

    if (!context?.trim()) {
      return NextResponse.json({ error: "Context is required" }, { status: 400 });
    }

    // Get the task to include its name
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Call Claude to analyze context and generate questions
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Task: "${task.name}"\n\nContext dump:\n${context}`,
        },
      ],
    });

    // Extract text response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(textContent.text);
    } catch {
      // If JSON parsing fails, try to extract from markdown code block
      const jsonMatch = textContent.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Invalid response format");
      }
    }

    // Save context to task
    await db
      .update(schema.tasks)
      .set({
        prdContext: context,
        prdChat: JSON.stringify([
          { role: "user", content: context },
          { role: "assistant", content: JSON.stringify(analysis) },
        ]),
        updatedAt: new Date(),
      })
      .where(eq(schema.tasks.id, taskId));

    return NextResponse.json({
      summary: analysis.summary,
      questions: analysis.questions || [],
    });
  } catch (error) {
    console.error("Error generating PRD analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze context" },
      { status: 500 }
    );
  }
}
