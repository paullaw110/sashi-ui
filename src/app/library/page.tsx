import { readdir, readFile } from "fs/promises";
import path from "path";
import { LibraryPageClient } from "./LibraryPageClient";

export const dynamic = "force-dynamic";

async function getPRDs() {
  const docsDir = path.join(process.cwd(), "docs");
  try {
    const files = await readdir(docsDir);
    const prdFiles = files.filter((f) => f.startsWith("PRD-") && f.endsWith(".md"));
    
    const prds = await Promise.all(
      prdFiles.map(async (filename) => {
        const content = await readFile(path.join(docsDir, filename), "utf-8");
        const title = content.split("\n")[0]?.replace(/^#\s*/, "") || filename;
        
        // Try to extract status from content
        let status: "draft" | "in_progress" | "built" | "on_hold" = "draft";
        if (content.includes("Status:** ✅") || content.includes("COMPLETE")) {
          status = "built";
        } else if (content.includes("In Progress") || content.includes("WIP")) {
          status = "in_progress";
        }
        
        return {
          filename,
          title,
          status,
          content,
        };
      })
    );
    
    return prds;
  } catch (error) {
    console.error("Error reading PRDs:", error);
    return [];
  }
}

async function getConfigFiles() {
  const workspaceDir = path.join(process.cwd(), "..");
  const configFiles = ["AGENTS.md", "SOUL.md", "USER.md", "TOOLS.md", "HEARTBEAT.md"];
  
  const configs = await Promise.all(
    configFiles.map(async (filename) => {
      try {
        const content = await readFile(path.join(workspaceDir, filename), "utf-8");
        return { filename, content };
      } catch {
        return null;
      }
    })
  );
  
  return configs.filter((c): c is { filename: string; content: string } => c !== null);
}

async function getSkills() {
  // Read skills from built-in and custom locations
  const skills = [
    { name: "bluebubbles", description: "iMessage channel plugin" },
    { name: "coding-agent", description: "Run Claude Code, Codex CLI, etc." },
    { name: "github", description: "GitHub CLI (issues, PRs, CI)" },
    { name: "notion", description: "Notion API (pages, databases)" },
    { name: "skill-creator", description: "Build new skills" },
    { name: "slack", description: "Slack actions (reactions, pins, etc.)" },
    { name: "weather", description: "Weather forecasts" },
    { name: "frontend-design", description: "Production-grade UI code" },
    { name: "remotion", description: "Animated video clips" },
  ];
  return skills;
}

export default async function LibraryPage() {
  const [prds, configs, skills] = await Promise.all([
    getPRDs(),
    getConfigFiles(),
    getSkills(),
  ]);
  
  return (
    <LibraryPageClient
      prds={prds}
      configs={configs}
      skills={skills}
    />
  );
}
