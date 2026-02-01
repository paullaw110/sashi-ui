"use client";

import { useState } from "react";
import { 
  Search, 
  Zap, 
  Code,
  CheckCircle,
  Copy,
  X,
  Settings,
  Globe,
  Brain,
  FileText,
  GitBranch,
  TestTube,
  Sword,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Skill type
type Skill = {
  id: string;
  name: string;
  description: string;
  category: "spell" | "skill";
  icon: string | typeof Zap;
  status: "active" | "building" | "available";
  trigger: string;
  location: string;
  lastUsed?: string | null;
  usageCount?: number;
};

// CAST Spells - Command-based workflow skills
const CAST_SPELLS: Skill[] = [
  {
    id: "create-prd",
    name: "CAST: CREATE_PRD",
    description: "Generate comprehensive PRD with stakeholder analysis, acceptance criteria, and test scenarios",
    category: "spell",
    icon: "⚡",
    status: "active",
    trigger: "CAST: CREATE_PRD [feature name]",
    location: "sashi-ui workflow",
    lastUsed: null,
    usageCount: 0,
  },
  {
    id: "generate-tasks",
    name: "CAST: GENERATE_TASKS",
    description: "Break down PRDs into actionable development tasks with effort estimates and dependencies",
    category: "spell",
    icon: "🎯",
    status: "active",
    trigger: "CAST: GENERATE_TASKS",
    location: "sashi-ui workflow",
    lastUsed: null,
    usageCount: 0,
  },
  {
    id: "setup-branch",
    name: "CAST: SETUP_BRANCH",
    description: "Initialize feature branch with proper Git structure, draft PR, and CI setup",
    category: "spell",
    icon: "🌿",
    status: "building",
    trigger: "CAST: SETUP_BRANCH [feature-name]",
    location: "In development",
    lastUsed: null,
    usageCount: 0,
  },
  {
    id: "generate-tests",
    name: "CAST: GENERATE_TESTS",
    description: "Generate Playwright tests from PRD acceptance criteria for test-first development",
    category: "spell",
    icon: "🧪",
    status: "building",
    trigger: "CAST: GENERATE_TESTS",
    location: "In development",
    lastUsed: null,
    usageCount: 0,
  },
  {
    id: "implement-feature",
    name: "CAST: IMPLEMENT_FEATURE",
    description: "Parallel backend + frontend development with coding agent orchestration",
    category: "spell",
    icon: "⚔️",
    status: "building",
    trigger: "CAST: IMPLEMENT_FEATURE",
    location: "In development",
    lastUsed: null,
    usageCount: 0,
  },
  {
    id: "validate-deploy",
    name: "CAST: VALIDATE_DEPLOY",
    description: "QA validation and production deployment with quality gates",
    category: "spell",
    icon: "🛡️",
    status: "building",
    trigger: "CAST: VALIDATE_DEPLOY",
    location: "In development",
    lastUsed: null,
    usageCount: 0,
  },
];

// Clawdbot Skills
const CLAWDBOT_SKILLS: Skill[] = [
  {
    id: "frontend-design",
    name: "Frontend Design",
    description: "Create distinctive, production-grade frontend interfaces with high design quality",
    category: "skill",
    icon: Code,
    status: "active",
    trigger: "Auto-triggers when building web components/pages",
    location: "Built-in skill",
  },
  {
    id: "github",
    name: "GitHub",
    description: "GitHub CLI for issues, PRs, CI runs, and API queries",
    category: "skill",
    icon: GitBranch,
    status: "active",
    trigger: "Auto-triggers for git operations",
    location: "Built-in skill",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Notion API for creating and managing pages, databases, and blocks",
    category: "skill",
    icon: FileText,
    status: "active",
    trigger: "Auto-triggers for Notion operations",
    location: "Built-in skill",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack actions including reactions, pins, and channel management",
    category: "skill",
    icon: Globe,
    status: "active",
    trigger: "Auto-triggers for Slack operations",
    location: "Built-in skill",
  },
  {
    id: "weather",
    name: "Weather",
    description: "Get current weather and forecasts (no API key required)",
    category: "skill",
    icon: Globe,
    status: "active",
    trigger: "Weather queries",
    location: "Built-in skill",
  },
  {
    id: "coding-agent",
    name: "Coding Agent",
    description: "Run Claude Code, Codex CLI, or other coding agents",
    category: "skill",
    icon: Brain,
    status: "active",
    trigger: "Complex coding tasks",
    location: "Built-in skill",
  },
];

const ALL_SKILLS = [...CAST_SPELLS, ...CLAWDBOT_SKILLS];

export function SkillsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "spell" | "skill">("all");
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    { id: "all" as const, name: "All", count: ALL_SKILLS.length },
    { id: "spell" as const, name: "CAST Spells", count: CAST_SPELLS.length },
    { id: "skill" as const, name: "Clawdbot Skills", count: CLAWDBOT_SKILLS.length },
  ];

  const copyToClipboard = (text: string, skillId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSkill(skillId);
      setTimeout(() => setCopiedSkill(null), 2000);
    });
  };

  const openSkillModal = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSkill(null);
  };

  const filteredSkills = ALL_SKILLS.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getIconElement = (skill: Skill) => {
    if (typeof skill.icon === "string") {
      return <span className="text-xl">{skill.icon}</span>;
    }
    const Icon = skill.icon;
    return <Icon size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-quaternary)]" size={16} />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-quaternary)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg transition-colors",
              selectedCategory === category.id
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            )}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            onClick={() => openSkillModal(skill)}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)] transition-colors cursor-pointer relative group"
          >
            {/* Copy Button - Shows on Hover */}
            <button
              onClick={(e) => copyToClipboard(skill.trigger, skill.id, e)}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-lg transition-all duration-200",
                copiedSkill === skill.id 
                  ? "bg-green-600/20 text-green-400 opacity-100" 
                  : "bg-[var(--bg-hover)] text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100"
              )}
              title={copiedSkill === skill.id ? "Copied!" : "Copy trigger command"}
            >
              <Copy size={16} />
            </button>

            <div className="flex items-start gap-3 mb-3 pr-12">
              <div className={cn(
                "p-2 rounded-lg",
                skill.status === "active" ? "bg-green-600/20 text-green-400" :
                skill.status === "building" ? "bg-amber-600/20 text-amber-400" :
                "bg-[var(--bg-hover)] text-[var(--text-quaternary)]"
              )}>
                {getIconElement(skill)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn(
                    "text-sm font-medium text-[var(--text-primary)]",
                    skill.category === "spell" && "font-mono"
                  )}>
                    {skill.name}
                  </h3>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium",
                    skill.status === "active" ? "bg-green-600/20 text-green-400" :
                    skill.status === "building" ? "bg-amber-600/20 text-amber-400" :
                    "bg-[var(--bg-hover)] text-[var(--text-quaternary)]"
                  )}>
                    {skill.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] capitalize">
                  {skill.category === "spell" ? "Workflow Spell" : "Clawdbot Skill"}
                </p>
              </div>
            </div>
            
            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              {skill.description}
            </p>
            
            <div>
              <p className="text-[10px] text-[var(--text-quaternary)] mb-1">Trigger:</p>
              <code className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-base)] px-2 py-1 rounded font-mono block truncate">
                {skill.trigger}
              </code>
            </div>
          </div>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <Zap className="mx-auto mb-4 text-[var(--text-quaternary)]" size={48} />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No skills found</h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            Try adjusting your search or category filter
          </p>
        </div>
      )}

      {/* Skill Detail Modal */}
      {isModalOpen && selectedSkill && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div 
            className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  selectedSkill.status === "active" ? "bg-green-600/20 text-green-400" :
                  selectedSkill.status === "building" ? "bg-amber-600/20 text-amber-400" :
                  "bg-[var(--bg-hover)] text-[var(--text-quaternary)]"
                )}>
                  {getIconElement(selectedSkill)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={cn(
                      "text-lg font-medium text-[var(--text-primary)]",
                      selectedSkill.category === "spell" && "font-mono"
                    )}>
                      {selectedSkill.name}
                    </h2>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium",
                      selectedSkill.status === "active" ? "bg-green-600/20 text-green-400" :
                      selectedSkill.status === "building" ? "bg-amber-600/20 text-amber-400" :
                      "bg-[var(--bg-hover)] text-[var(--text-quaternary)]"
                    )}>
                      {selectedSkill.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-tertiary)] capitalize">
                    {selectedSkill.category === "spell" ? "Workflow Spell" : "Clawdbot Skill"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Description</h3>
                <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">{selectedSkill.description}</p>
              </div>

              {/* Trigger Command */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Trigger Command</h3>
                  <button
                    onClick={(e) => copyToClipboard(selectedSkill.trigger, selectedSkill.id, e)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                      copiedSkill === selectedSkill.id 
                        ? "bg-green-600/20 text-green-400" 
                        : "bg-[var(--bg-hover)] text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)]"
                    )}
                  >
                    <Copy size={12} />
                    {copiedSkill === selectedSkill.id ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="block text-sm text-[var(--text-secondary)] bg-[var(--bg-surface)] px-3 py-2 rounded font-mono">
                  {selectedSkill.trigger}
                </code>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Location</h3>
                <p className="text-sm text-[var(--text-tertiary)]">{selectedSkill.location}</p>
              </div>

              {/* Documentation */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Documentation</h3>
                <div className="bg-[var(--bg-surface)] rounded-lg p-4">
                  {selectedSkill.status === "active" ? (
                    <div className="space-y-2 text-sm text-[var(--text-tertiary)]">
                      <p>This {selectedSkill.category === "spell" ? "spell" : "skill"} is currently active and ready to use.</p>
                      <p>Use the trigger command above to invoke it in any channel.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-[var(--text-tertiary)]">
                      <p>This spell is currently in development as part of the CAST workflow system.</p>
                      <p>Once implementation is complete, you&apos;ll be able to use this workflow command.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
