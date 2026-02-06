import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// Clawdbot gateway URL and channel for sending messages
const CLAWDBOT_GATEWAY_URL = process.env.CLAWDBOT_GATEWAY_URL || "http://localhost:3033";
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || "C0A8PKXCTGW"; // #general

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { context, answers } = body;

    // Get the task with org and project context
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
      with: {
        organization: true,
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Build context string with org/project info
    const orgContext = task.organization 
      ? `Organization: ${task.organization.name}${task.organization.description ? ` - ${task.organization.description}` : ''}`
      : null;
    const projectContext = task.project
      ? `Project: ${task.project.name}${task.project.type ? ` (${task.project.type})` : ''}${(task.project as any).techStack ? ` | Tech: ${(task.project as any).techStack}` : ''}`
      : null;
    const githubContext = (task as any).githubUrl ? `GitHub: ${(task as any).githubUrl}` : null;
    const figmaContext = (task as any).figmaUrl ? `Figma: ${(task as any).figmaUrl}` : null;

    // If this is initial context submission
    if (context && !answers) {
      if (!context.trim()) {
        return NextResponse.json({ error: "Context is required" }, { status: 400 });
      }

      // Save context and mark as pending
      const chatState = {
        status: "analyzing",
        context: context,
        questions: null,
        answers: null,
        prd: null,
      };

      await db
        .update(schema.tasks)
        .set({
          prdContext: context,
          prdChat: JSON.stringify(chatState),
          updatedAt: new Date(),
        })
        .where(eq(schema.tasks.id, taskId));

      // Send message to Sashi via Slack
      const message = `🎯 **PRD Request** for task: "${task.name}" (ID: ${taskId})
${orgContext ? `\n${orgContext}` : ''}${projectContext ? `\n${projectContext}` : ''}${githubContext ? `\n${githubContext}` : ''}${figmaContext ? `\n${figmaContext}` : ''}

**Context dump:**
${context}

Please analyze this context, identify gaps, and generate 2-4 clarifying questions. Then update the task's prdChat field with your questions using this format:

\`\`\`json
{
  "status": "clarifying",
  "context": "...",
  "questions": ["Question 1?", "Question 2?"],
  "summary": "Brief summary of what you understood"
}
\`\`\`

Use the API: PATCH /api/tasks/${taskId} with { prdChat: JSON.stringify(...) }`;

      // Try to send via Clawdbot gateway
      try {
        await fetch(`${CLAWDBOT_GATEWAY_URL}/api/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "slack",
            to: SLACK_CHANNEL_ID,
            message: message,
          }),
        });
      } catch (e) {
        console.log("Could not reach Clawdbot gateway, message will be seen via Slack webhook");
      }

      return NextResponse.json({
        status: "analyzing",
        message: "Context received. Sashi is analyzing it now.",
      });
    }

    // If this is answers to clarifying questions
    if (answers) {
      // Parse current chat state
      let chatState;
      try {
        chatState = JSON.parse(task.prdChat || "{}");
      } catch {
        chatState = {};
      }

      // Update with answers
      chatState.answers = answers;
      chatState.status = "generating";

      await db
        .update(schema.tasks)
        .set({
          prdChat: JSON.stringify(chatState),
          updatedAt: new Date(),
        })
        .where(eq(schema.tasks.id, taskId));

      // Send follow-up message to Sashi
      const message = `📝 **PRD Answers** for task: "${task.name}" (ID: ${taskId})
${orgContext ? `\n${orgContext}` : ''}${projectContext ? `\n${projectContext}` : ''}

**Original context:**
${chatState.context}

**Questions asked:**
${chatState.questions?.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n") || "None"}

**User's answers:**
${Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join("\n\n")}

Now generate a full PRD using the CAST format. Save it to the task's prd field and update prdChat status to "complete".

PATCH /api/tasks/${taskId} with { prd: "...", prdChat: JSON.stringify({ status: "complete", ... }) }`;

      try {
        await fetch(`${CLAWDBOT_GATEWAY_URL}/api/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "slack",
            to: SLACK_CHANNEL_ID,
            message: message,
          }),
        });
      } catch (e) {
        console.log("Could not reach Clawdbot gateway");
      }

      return NextResponse.json({
        status: "generating",
        message: "Answers received. Sashi is generating the PRD now.",
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error in PRD generation:", error);
    return NextResponse.json(
      { error: "Failed to process PRD request" },
      { status: 500 }
    );
  }
}

// GET endpoint to check PRD status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
      columns: {
        prd: true,
        prdContext: true,
        prdChat: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    let chatState;
    try {
      chatState = JSON.parse(task.prdChat || "{}");
    } catch {
      chatState = {};
    }

    return NextResponse.json({
      status: chatState.status || "none",
      context: task.prdContext,
      questions: chatState.questions,
      summary: chatState.summary,
      answers: chatState.answers,
      prd: task.prd,
    });
  } catch (error) {
    console.error("Error fetching PRD status:", error);
    return NextResponse.json(
      { error: "Failed to fetch PRD status" },
      { status: 500 }
    );
  }
}
