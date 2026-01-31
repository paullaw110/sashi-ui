"use client";

import { useState } from "react";
import { 
  Search, 
  Settings, 
  Zap, 
  Globe, 
  MessageSquare, 
  Camera, 
  Music, 
  Code,
  Brain,
  CheckCircle,
  Circle,
  Plus,
  ExternalLink,
  Copy,
  X
} from "lucide-react";

// CAST Skills Library - Command-based workflow skills for enhanced productivity
const CAST_SKILLS = [
  // Active Skills (Auto-triggering)
  {
    id: "frontend-design",
    name: "Frontend Design",
    description: "Create distinctive, production-grade frontend interfaces with high design quality",
    category: "design",
    icon: Code,
    enabled: true,
    lastUsed: "2026-01-30T15:20:00Z",
    usageCount: 18,
    status: "active",
    trigger: "Auto-triggers when building web components/pages",
    location: "Built-in skill"
  },
  {
    id: "remotion",
    name: "Remotion Video Creation",
    description: "Create animated video clips from designs using React-based video framework",
    category: "media",
    icon: Camera,
    enabled: true,
    lastUsed: "2026-01-29T11:15:00Z",
    usageCount: 7,
    status: "active",
    trigger: "Auto-triggers for social media posts, design showcases",
    location: "Built-in skill"
  },
  
  // CAST Workflow Commands (Implementation in Progress)
  {
    id: "create-prd",
    name: "CAST: CREATE_PRD",
    description: "Generate comprehensive Product Requirements Documents with stakeholder analysis and success metrics",
    category: "workflow",
    icon: Zap,
    enabled: false,
    lastUsed: null,
    usageCount: 0,
    status: "building",
    trigger: "CAST: CREATE_PRD [feature name]",
    location: "In development"
  },
  {
    id: "generate-tasks",
    name: "CAST: GENERATE_TASKS",
    description: "Break down PRDs into actionable development tasks with effort estimates",
    category: "workflow", 
    icon: Settings,
    enabled: false,
    lastUsed: null,
    usageCount: 0,
    status: "building",
    trigger: "CAST: GENERATE_TASKS",
    location: "In development"
  },
  {
    id: "setup-branch",
    name: "CAST: SETUP_BRANCH",
    description: "Initialize feature branch with proper Git structure and CI setup",
    category: "workflow",
    icon: Code,
    enabled: false,
    lastUsed: null,
    usageCount: 0,
    status: "building",
    trigger: "CAST: SETUP_BRANCH [feature-name]",
    location: "In development"
  },
  {
    id: "generate-tests",
    name: "CAST: GENERATE_TESTS",
    description: "Generate Playwright tests from PRD acceptance criteria for test-first development",
    category: "workflow",
    icon: CheckCircle,
    enabled: false,
    lastUsed: null,
    usageCount: 0,
    status: "building",
    trigger: "CAST: GENERATE_TESTS",
    location: "In development"
  },
  {
    id: "implement-feature",
    name: "CAST: IMPLEMENT_FEATURE",
    description: "Parallel backend + frontend development with coding agent orchestration",
    category: "workflow",
    icon: Brain,
    enabled: false,
    lastUsed: null,
    usageCount: 0,
    status: "building",
    trigger: "CAST: IMPLEMENT_FEATURE",
    location: "In development"
  },
  {
    id: "validate-deploy",
    name: "CAST: VALIDATE_DEPLOY",
    description: "QA validation and production deployment with quality gates",
    category: "workflow",
    icon: Globe,
    enabled: false,
    lastUsed: null,
    usageCount: 0,
    status: "building",
    trigger: "CAST: VALIDATE_DEPLOY",
    location: "In development"
  }
];

// Categories will be calculated dynamically in the component

export function SkillsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [skills, setSkills] = useState(CAST_SKILLS);
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<typeof CAST_SKILLS[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate categories dynamically 
  const CATEGORIES = [
    { id: "all", name: "All Skills", count: skills.length },
    { id: "workflow", name: "Workflow", count: skills.filter(s => s.category === "workflow").length },
    { id: "design", name: "Design", count: skills.filter(s => s.category === "design").length },
    { id: "media", name: "Media", count: skills.filter(s => s.category === "media").length },
  ];

  const copyToClipboard = (text: string, skillId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent modal from opening
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSkill(skillId);
      setTimeout(() => setCopiedSkill(null), 2000); // Clear after 2 seconds
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  const openSkillModal = (skill: typeof CAST_SKILLS[0]) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSkill(null);
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatLastUsed = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return diffMins + 'm ago';
    if (diffHours < 24) return diffHours + 'h ago';
    return diffDays + 'd ago';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#525252]" size={16} />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-sm text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#333] transition-colors"
          />
        </div>
        <a 
          href="https://github.com/paullaw110/sashi-ui"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-[#1c1c1c] text-[#f5f5f5] text-sm rounded-lg hover:bg-[#252525] transition-colors"
        >
          <ExternalLink size={16} />
          View Source
        </a>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={'px-3 py-1.5 text-xs rounded transition-colors ' + (
              selectedCategory === category.id
                ? 'bg-[#1c1c1c] text-[#f5f5f5] border border-[#333]'
                : 'text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616]'
            )}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => {
          const Icon = skill.icon;
          return (
            <div
              key={skill.id}
              onClick={() => openSkillModal(skill)}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:bg-[#111] hover:border-[#333] transition-colors cursor-pointer relative group"
            >
              {/* Copy Button - Shows on Hover */}
              <button
                onClick={(e) => copyToClipboard(skill.trigger, skill.id, e)}
                className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                  copiedSkill === skill.id 
                    ? 'bg-green-600/20 text-green-400 opacity-100' 
                    : 'bg-[#1a1a1a] text-[#525252] hover:text-[#737373] opacity-0 group-hover:opacity-100'
                }`}
                title={copiedSkill === skill.id ? 'Copied!' : 'Copy trigger command'}
              >
                <Copy size={16} />
              </button>

              <div className="flex items-start justify-between mb-3 pr-12">
                <div className="flex items-center gap-3">
                  <div className={'p-2 rounded-lg ' + (
                    skill.status === "active" ? 'bg-green-600/20 text-green-400' :
                    skill.status === "building" ? 'bg-orange-600/20 text-orange-400' :
                    'bg-[#1a1a1a] text-[#525252]'
                  )}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-[#f5f5f5]">{skill.name}</h3>
                      <span className={'text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ' + (
                        skill.status === "active" ? 'bg-green-600/20 text-green-400' :
                        skill.status === "building" ? 'bg-orange-600/20 text-orange-400' :
                        'bg-[#1a1a1a] text-[#525252]'
                      )}>
                        {skill.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#737373] capitalize">{skill.category}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-[#737373] mb-2 leading-relaxed">
                {skill.description}
              </p>
              
              <div className="mb-4">
                <p className="text-[10px] text-[#525252] mb-1">Trigger:</p>
                <code className="text-[10px] text-[#e5e5e5] bg-[#1a1a1a] px-2 py-1 rounded font-mono">
                  {skill.trigger}
                </code>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="text-[#525252]">
                  Last used: <span className="text-[#737373]">{formatLastUsed(skill.lastUsed)}</span>
                </div>
                <div className="text-[#525252]">
                  Usage: <span className="text-[#737373]">{skill.usageCount} times</span>
                </div>
                <div className="text-[#525252]">
                  Location: <span className="text-[#737373]">{skill.location}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <Brain className="mx-auto mb-4 text-[#525252]" size={48} />
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-2">No skills found</h3>
          <p className="text-sm text-[#737373]">
            Try adjusting your search or category filter
          </p>
        </div>
      )}

      {/* Skill Detail Modal */}
      {isModalOpen && selectedSkill && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div className={'p-2 rounded-lg ' + (
                  selectedSkill.status === "active" ? 'bg-green-600/20 text-green-400' :
                  selectedSkill.status === "building" ? 'bg-orange-600/20 text-orange-400' :
                  'bg-[#1a1a1a] text-[#525252]'
                )}>
                  <selectedSkill.icon size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-[#f5f5f5]">{selectedSkill.name}</h2>
                    <span className={'text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ' + (
                      selectedSkill.status === "active" ? 'bg-green-600/20 text-green-400' :
                      selectedSkill.status === "building" ? 'bg-orange-600/20 text-orange-400' :
                      'bg-[#1a1a1a] text-[#525252]'
                    )}>
                      {selectedSkill.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#737373] capitalize">{selectedSkill.category}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-[#525252] hover:text-[#737373] hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">Description</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{selectedSkill.description}</p>
              </div>

              {/* Trigger Command */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#f5f5f5]">Trigger Command</h3>
                  <button
                    onClick={(e) => copyToClipboard(selectedSkill.trigger, selectedSkill.id, e)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      copiedSkill === selectedSkill.id 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-[#1a1a1a] text-[#525252] hover:text-[#737373]'
                    }`}
                  >
                    <Copy size={12} />
                    {copiedSkill === selectedSkill.id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <code className="block text-sm text-[#e5e5e5] bg-[#1a1a1a] px-3 py-2 rounded font-mono">
                  {selectedSkill.trigger}
                </code>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">Last Used</h3>
                  <p className="text-sm text-[#737373]">{formatLastUsed(selectedSkill.lastUsed)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">Usage Count</h3>
                  <p className="text-sm text-[#737373]">{selectedSkill.usageCount} times</p>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">Location</h3>
                <p className="text-sm text-[#737373]">{selectedSkill.location}</p>
              </div>

              {/* Documentation - Placeholder for now */}
              <div>
                <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">Documentation</h3>
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  {selectedSkill.status === "active" ? (
                    <div className="space-y-2 text-sm text-[#737373]">
                      <p>This skill is currently active and ready to use.</p>
                      <p>Use the trigger command above to invoke this skill in any channel.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-[#737373]">
                      <p>This skill is currently in development as part of the CAST Skills Library.</p>
                      <p>Once implementation is complete, you'll be able to use this workflow command across all channels.</p>
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