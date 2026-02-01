import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { inArray } from "drizzle-orm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Bulk update tasks
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskIds, updates } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "taskIds array is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "updates object is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.priority !== undefined) {
      updateData.priority = updates.priority;
    }
    if (updates.projectId !== undefined) {
      updateData.projectId = updates.projectId;
    }
    if (updates.organizationId !== undefined) {
      updateData.organizationId = updates.organizationId;
    }
    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Perform bulk update
    await db
      .update(schema.tasks)
      .set(updateData)
      .where(inArray(schema.tasks.id, taskIds));

    return NextResponse.json(
      { success: true, updatedCount: taskIds.length },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Failed to update tasks" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Bulk delete tasks
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskIds } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "taskIds array is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Perform bulk delete
    await db
      .delete(schema.tasks)
      .where(inArray(schema.tasks.id, taskIds));

    return NextResponse.json(
      { success: true, deletedCount: taskIds.length },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete tasks" },
      { status: 500, headers: corsHeaders }
    );
  }
}
