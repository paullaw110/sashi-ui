"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
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
  ExternalLink
} from "lucide-react";

// Mock skills data - in a real app, this would come from an API
const MOCK_SKILLS = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the web using Brave Search API with region-specific results",
    category: "research",
    icon: Globe,
    enabled: true,
    lastUsed: "2024-01-15T10:30:00Z",
    usageCount: 45,
    status: "active"
  },
  {
    id: "message-control",
    name: "Message Control",
    description: "Send, delete, and manage messages via various channel plugins",
    category: "communication",
    icon: MessageSquare,
    enabled: true,
    lastUsed: "2024-01-15T09:15:00Z",
    usageCount: 23,
    status: "active"
  },
  {
    id: "camera-capture",
    name: "Camera Capture",
    description: "Take photos and record videos from paired devices",
    category: "media",
    icon: Camera,
    enabled: false,
    lastUsed: null,
    usageCount: 0,
    status: "disabled"
  },
  {
    id: "text-to-speech",
    name: "Text to Speech",
    description: "Convert text to natural speech with voice customization",
    category: "audio",
    icon: Music,
    enabled: true,
    lastUsed: "2024-01-14T16:20:00Z",
    usageCount: 8,
    status: "active"
  },
  {
    id: "code-execution",
    name: "Code Execution",
    description: "Execute shell commands and manage background processes",
    category: "development",
    icon: Code,
    enabled: true,
    lastUsed: "2024-01-15T11:45:00Z",
    usageCount: 67,
    status: "active"
  },
  {
    id: "image-analysis",
    name: "Image Analysis",
    description: "Analyze images with vision models for content understanding",
    category: "ai",
    icon: Brain,
    enabled: true,
    lastUsed: "2024-01-15T08:30:00Z",
    usageCount: 12,
    status: "active"
  },
  // Feature Development Workflow Skills - CAST Commands
  {
    id: "create-prd",
    name: "*CAST: CREATE_PRD*",
    description: "Generate comprehensive PRD with test scenarios and acceptance criteria",
    category: "workflow",
    icon: Zap,
    enabled: true,
    lastUsed: "2024-01-15T14:20:00Z",
    usageCount: 5,
    status: "active"
  },
  {
    id: "generate-tasks",
    name: "*CAST: GENERATE_TASKS*",
    description: "Break down PRD into actionable tasks with test plans",
    category: "workflow", 
    icon: Settings,
    enabled: true,
    lastUsed: "2024-01-15T14:25:00Z",
    usageCount: 4,
    status: "active"
  },
  {
    id: "setup-branch",
    name: "*CAST: SETUP_BRANCH*",
    description: "Git workflow automation + draft PR creation",
    category: "workflow",
    icon: Code,
    enabled: true,
    lastUsed: "2024-01-15T14:30:00Z",
    usageCount: 3,
    status: "active"
  },
  {
    id: "generate-tests",
    name: "*CAST: GENERATE_TESTS*",
    description: "Playwright tests from acceptance criteria - test-first development",
    category: "workflow",
    icon: CheckCircle,
    enabled: true,
    lastUsed: "2024-01-15T14:35:00Z",
    usageCount: 3,
    status: "active"
  },
  {
    id: "implement-feature",
    name: "*CAST: IMPLEMENT_FEATURE*",
    description: "Parallel coding agent orchestration for backend + frontend",
    category: "workflow",
    icon: Code,
    enabled: true,
    lastUsed: "2024-01-15T14:40:00Z",
    usageCount: 2,
    status: "active"
  },
  {
    id: "validate-deploy",
    name: "*CAST: VALIDATE_DEPLOY*",
    description: "Quality gates + production deployment pipeline",
    category: "workflow",
    icon: CheckCircle,
    enabled: true,
    lastUsed: "2024-01-15T14:45:00Z",
    usageCount: 2,
    status: "active"
  }
];

const CATEGORIES = [
  { id: "all", name: "All Skills", count: MOCK_SKILLS.length },
  { id: "workflow", name: "Workflow", count: MOCK_SKILLS.filter(s => s.category === "workflow").length },
  { id: "research", name: "Research", count: MOCK_SKILLS.filter(s => s.category === "research").length },
  { id: "communication", name: "Communication", count: MOCK_SKILLS.filter(s => s.category === "communication").length },
  { id: "media", name: "Media", count: MOCK_SKILLS.filter(s => s.category === "media").length },
  { id: "audio", name: "Audio", count: MOCK_SKILLS.filter(s => s.category === "audio").length },
  { id: "development", name: "Development", count: MOCK_SKILLS.filter(s => s.category === "development").length },
  { id: "ai", name: "AI", count: MOCK_SKILLS.filter(s => s.category === "ai").length },
];

export function SkillsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [skills, setSkills] = useState(MOCK_SKILLS);

  const toggleSkill = (skillId: string) => {
    setSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, enabled: !skill.enabled, status: !skill.enabled ? "active" : "disabled" }
        : skill
    ));
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
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1c1c1c] text-[#f5f5f5] text-sm rounded-lg hover:bg-[#252525] transition-colors">
          <Plus size={16} />
          Add Skill
        </button>
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
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#333] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={'p-2 rounded-lg ' + (skill.enabled ? 'bg-blue-600/20 text-blue-400' : 'bg-[#1a1a1a] text-[#525252]')}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#f5f5f5]">{skill.name}</h3>
                    <p className="text-xs text-[#737373] capitalize">{skill.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSkill(skill.id)}
                  className={'p-1 rounded transition-colors ' + (
                    skill.enabled 
                      ? 'text-green-500 hover:text-green-400' 
                      : 'text-[#525252] hover:text-[#737373]'
                  )}
                >
                  {skill.enabled ? <CheckCircle size={18} /> : <Circle size={18} />}
                </button>
              </div>
              
              <p className="text-xs text-[#737373] mb-4 leading-relaxed">
                {skill.description}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-[#525252]">
                    Last used: <span className="text-[#737373]">{formatLastUsed(skill.lastUsed)}</span>
                  </div>
                  <div className="text-[#525252]">
                    Usage: <span className="text-[#737373]">{skill.usageCount} times</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 text-[#525252] hover:text-[#737373] hover:bg-[#1a1a1a] rounded transition-colors">
                    <Settings size={14} />
                  </button>
                  <button className="p-1.5 text-[#525252] hover:text-[#737373] hover:bg-[#1a1a1a] rounded transition-colors">
                    <ExternalLink size={14} />
                  </button>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-blue-500" size={16} />
            <span className="text-xs text-[#737373]">Total Skills</span>
          </div>
          <span className="text-2xl font-bold text-[#f5f5f5]">{skills.length}</span>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-500" size={16} />
            <span className="text-xs text-[#737373]">Active</span>
          </div>
          <span className="text-2xl font-bold text-[#f5f5f5]">
            {skills.filter(s => s.enabled).length}
          </span>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="text-[#737373]" size={16} />
            <span className="text-xs text-[#737373]">Disabled</span>
          </div>
          <span className="text-2xl font-bold text-[#f5f5f5]">
            {skills.filter(s => !s.enabled).length}
          </span>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="text-purple-500" size={16} />
            <span className="text-xs text-[#737373]">Categories</span>
          </div>
          <span className="text-2xl font-bold text-[#f5f5f5]">
            {CATEGORIES.length - 1}
          </span>
        </div>
      </div>
    </div>
  );
}