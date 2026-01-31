import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const PRD_GENERATION_PROMPT = `You are an expert product manager. Generate a concise PRD based on the context and Q&A provided.

Structure:
## Problem
What problem are we solving? (2-3 sentences)

## Solution
How will we solve it? (2-3 sentences)

## Scope
**In scope:**
- Bullet points of what's included

**Out of scope:**
- What we're NOT doing

## Success Criteria
- Measurable outcomes

## Implementation Notes
- Key technical or design considerations

Keep it actionable and concise. No fluff.

After the PRD, suggest 4-8 subtasks in JSON format:
\`\`\`json
{
  "subtasks": [
    { "name": "Task name", "description": "Brief description" }
  ]
}
\`\`\``;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { answers } = body;

    // Get the task with existing context
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!task.prdContext) {
      return NextResponse.json(
        { error: "No context found. Start with generate-prd first." },
        { status: 400 }
      );
    }

    // Parse existing chat history
    let chatHistory: Array<{ role: string; content: string }> = [];
    if (task.prdChat) {
      try {
        chatHistory = JSON.parse(task.prdChat);
      } catch {
        // Ignore parse errors
      }
    }

    // Add the answers to chat history
    if (answers) {
      chatHistory.push({ role: "user", content: answers });
    }

    // Build the prompt with full context
    const contextPrompt = `Task: "${task.name}"

Original context:
${task.prdContext}

${answers ? `Additional answers/context:
${answers}` : ""}

Generate a PRD for this task.`;

    // Call Claude to generate PRD
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: PRD_GENERATION_PROMPT,
      messages: [
        {
          role: "user",
          content: contextPrompt,
        },
      ],
    });

    // Extract text response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    const fullResponse = textContent.text;

    // Split PRD markdown from subtasks JSON
    let prd = fullResponse;
    let suggestedSubtasks: Array<{ name: string; description: string }> = [];

    const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      // Remove JSON block from PRD
      prd = fullResponse.replace(/```json\s*[\s\S]*?\s*```/, "").trim();

      try {
        const parsed = JSON.parse(jsonMatch[1]);
        suggestedSubtasks = parsed.subtasks || [];
      } catch {
        // Ignore JSON parse errors for subtasks
      }
    }

    // Update chat history
    chatHistory.push({ role: "assistant", content: fullResponse });

    // Save PRD to task
    await db
      .update(schema.tasks)
      .set({
        prd,
        prdChat: JSON.stringify(chatHistory),
        updatedAt: new Date(),
      })
      .where(eq(schema.tasks.id, taskId));

    return NextResponse.json({
      prd,
      suggestedSubtasks,
    });
  } catch (error) {
    console.error("Error generating PRD:", error);
    return NextResponse.json(
      { error: "Failed to generate PRD" },
      { status: 500 }
    );
  }
}
