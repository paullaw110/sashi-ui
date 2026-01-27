import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATUS_FILE = path.join(process.cwd(), "db", "sashi-status.json");

interface SashiStatus {
  state: "idle" | "working" | "waiting";
  task: string | null;
  startedAt: string | null;
  updatedAt: string;
}

function getStatus(): SashiStatus {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading status:", e);
  }
  return {
    state: "idle",
    task: null,
    startedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function setStatus(status: Partial<SashiStatus>): SashiStatus {
  const current = getStatus();
  const updated: SashiStatus = {
    ...current,
    ...status,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

export async function GET() {
  const status = getStatus();
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const status = setStatus({
      state: body.state || "idle",
      task: body.task || null,
      startedAt: body.state === "working" ? new Date().toISOString() : null,
    });
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
