"use client";

import { useState } from "react";
import { Copy, ExternalLink, Code, Eye, Folder, Search } from "lucide-react";

interface CodeExperiment {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  code: string;
  preview?: string; // URL or base64 image
  tags: string[];
  created: string;
}

const EXPERIMENTS: CodeExperiment[] = [
  {
    id: "animated-button",
    title: "Animated Button Hover",
    description: "CSS button with smooth hover animations and glow effect",
    category: "UI Components",
    language: "css",
    tags: ["animation", "button", "hover", "css"],
    created: "2026-01-29",
    code: `.animated-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  padding: 12px 24px;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

.animated-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.animated-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.animated-button:hover::before {
  left: 100%;
}`,
    preview: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMGEwYTBhIi8+CjxyZWN0IHg9IjUwIiB5PSIzMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI0MCIgcng9IjEyIiBmaWxsPSJ1cmwoI2dyYWQxKSIvPgo8dGV4dCB4PSIxMDAiIHk9IjU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkJ1dHRvbjwvdGV4dD4KPGR2ZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjY3ZWVhO3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3NjRiYTI7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+"
  },
  {
    id: "particle-system",
    title: "Canvas Particle System",
    description: "Interactive particle animation with mouse attraction",
    category: "Animations",
    language: "javascript",
    tags: ["canvas", "particles", "animation", "interactive"],
    created: "2026-01-29",
    code: `class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    
    this.setupCanvas();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }
  
  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticles() {
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        life: 1
      });
    }
  }
  
  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }
  
  animate() {
    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      // Mouse attraction
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        particle.vx += dx * 0.0001;
        particle.vy += dy * 0.0001;
      }
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
      
      // Draw particle
      this.ctx.fillStyle = \`rgba(102, 126, 234, \${particle.life})\`;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize
const canvas = document.getElementById('particles');
new ParticleSystem(canvas);`,
    preview: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMGEwYTBhIi8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMjAiIHI9IjIiIGZpbGw9IiM2NjdlZWEiIG9wYWNpdHk9IjAuOCIvPgo8Y2lyY2xlIGN4PSI4MCIgY3k9IjQwIiByPSIzIiBmaWxsPSIjNjY3ZWVhIiBvcGFjaXR5PSIwLjYiLz4KPGNPCMXBIGY9IjE0MCIgY3k9IjI1IiByPSIyLjUiIGZpbGw9IiM2NjdlZWEiIG9wYWNpdHk9IjAuNyIvPgo8Y2lyY2xlIGN4PSIxNzAiIGN5PSI3MCIgcj0iMiIgZmlsbD0iIzY2N2VlYSIgb3BhY2l0eT0iMC45Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iODAiIHI9IjEuNSIgZmlsbD0iIzY2N2VlYSIgb3BhY2l0eT0iMC41Ii8+CjxjaXJjbGUgY3g9IjEyMCIgY3k9IjY1IiByPSIyLjUiIGZpbGw9IiM2NjdlZWEiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4="
  },
  {
    id: "react-counter",
    title: "React Counter Hook",
    description: "Custom React hook for counter with increment, decrement, and reset",
    category: "React Hooks",
    language: "typescript",
    tags: ["react", "hooks", "counter", "typescript"],
    created: "2026-01-28",
    code: `import { useState, useCallback } from 'react';

interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setValue: (value: number) => void;
}

interface UseCounterOptions {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function useCounter(options: UseCounterOptions = {}): UseCounterReturn {
  const { 
    initialValue = 0, 
    min = -Infinity, 
    max = Infinity, 
    step = 1 
  } = options;
  
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => {
    setCount(prev => Math.min(prev + step, max));
  }, [step, max]);
  
  const decrement = useCallback(() => {
    setCount(prev => Math.max(prev - step, min));
  }, [step, min]);
  
  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);
  
  const setValue = useCallback((value: number) => {
    setCount(Math.min(Math.max(value, min), max));
  }, [min, max]);
  
  return { count, increment, decrement, reset, setValue };
}

// Usage Example:
function CounterComponent() {
  const { count, increment, decrement, reset } = useCounter({
    initialValue: 0,
    min: 0,
    max: 10,
    step: 1
  });
  
  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}`,
    preview: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMGEwYTBhIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmNWY1ZjUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2Ij5Db3VudDogNTwvdGV4dD4KPHJlY3QgeD0iNDAiIHk9IjUwIiB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHJ4PSI0IiBmaWxsPSIjMzMzIiBzdHJva2U9IiM1NTUiLz4KPHRVA0IgeD0iNTUiIHk9IjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZjVmNWY1IiBmb250LXNpemU9IjE4Ij4tPC90ZXh0Pgo8cmVjdCB4PSI4NSIgeT0iNTAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgcng9IjQiIGZpbGw9IiMzMzMiIHN0cm9rZT0iIzU1NSIvPgo8dGV4dCB4PSIxMDAiIHk9IjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZjVmNWY1IiBmb250LXNpemU9IjE4Ij4rPC90ZXh0Pgo8cmVjdCB4PSIxMzAiIHk9IjUwIiB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHJ4PSI0IiBmaWxsPSIjMzMzIiBzdHJva2U9IiM1NTUiLz4KPHRLEA0IgeD0iMTUwIiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2Y1ZjVmNSIgZm9udC1zaXplPSIxMiI+UmVzZXQ8L3RleHQ+Cjwvc3ZnPg=="
  },
  {
    id: "gradient-text",
    title: "Animated Gradient Text",
    description: "CSS text with animated rainbow gradient effect",
    category: "UI Components",
    language: "css",
    tags: ["css", "gradient", "animation", "text"],
    created: "2026-01-28",
    code: `.gradient-text {
  background: linear-gradient(
    45deg,
    #ff6b6b,
    #4ecdc4,
    #45b7d1,
    #96ceb4,
    #feca57,
    #ff9ff3,
    #54a0ff
  );
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 4s ease-in-out infinite;
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: -0.02em;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.gradient-text:hover {
  animation-duration: 1s;
}`,
    preview: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMGEwYTBhIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InJhaW5ib3ciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmY2YjZiO3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjE0LjI4JSIgc3R5bGU9InN0b3AtY29sb3I6IzRlY2RjNDtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIyOC41NyUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0NWI3ZDE7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHRLEA0IgeD0iMTAwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0idXJsKCNyYWluYm93KSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIj5HcmFkaWVudDwvdGV4dD4KPC9zdmc+"
  }
];

const CATEGORIES = ["All", "UI Components", "Animations", "React Hooks", "Utilities"];

export function CodePlayground() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExperiment, setSelectedExperiment] = useState<CodeExperiment | null>(null);

  const filteredExperiments = EXPERIMENTS.filter(exp => {
    const matchesCategory = selectedCategory === "All" || exp.category === selectedCategory;
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyCode = (code: string, title: string) => {
    navigator.clipboard.writeText(code);
    // Could add toast notification here
  };

  const handleOpenInEditor = (experiment: CodeExperiment) => {
    setSelectedExperiment(experiment);
  };

  if (selectedExperiment) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => setSelectedExperiment(null)}
              className="text-[#737373] hover:text-[#f5f5f5] text-sm mb-2"
            >
              ← Back to Library
            </button>
            <h1 className="text-xl font-bold text-[#f5f5f5]">{selectedExperiment.title}</h1>
            <p className="text-[#737373] text-sm">{selectedExperiment.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopyCode(selectedExperiment.code, selectedExperiment.title)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1c1c1c] text-[#f5f5f5] border border-[#333] rounded hover:bg-[#2a2a2a] transition-colors"
            >
              <Copy size={14} />
              Copy Code
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#f5f5f5]">
              {selectedExperiment.language.toUpperCase()} Code
            </h3>
            <div className="h-[500px] p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-auto">
              <pre className="text-sm font-mono text-[#f5f5f5] whitespace-pre-wrap">
                {selectedExperiment.code}
              </pre>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#f5f5f5]">Preview</h3>
            <div className="h-[500px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg flex items-center justify-center">
              {selectedExperiment.preview ? (
                <img 
                  src={selectedExperiment.preview} 
                  alt={`${selectedExperiment.title} preview`}
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <div className="text-[#525252] text-center">
                  <Eye size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No preview available</p>
                  <p className="text-xs">Preview will show rendered output</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
          <div className="flex flex-wrap gap-4 text-sm text-[#737373]">
            <span>Category: <span className="text-[#f5f5f5]">{selectedExperiment.category}</span></span>
            <span>Language: <span className="text-[#f5f5f5]">{selectedExperiment.language}</span></span>
            <span>Created: <span className="text-[#f5f5f5]">{selectedExperiment.created}</span></span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedExperiment.tags.map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-[#1a1a1a] text-[#737373] rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5f5]">Code Playground</h1>
          <p className="text-[#737373] text-sm">Library of code experiments you can copy and explore</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              placeholder="Search experiments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 text-sm bg-[#1a1a1a] border border-[#333] rounded-lg text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#555] transition-colors w-64"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              selectedCategory === category
                ? 'bg-[#1c1c1c] text-[#f5f5f5] border border-[#333]'
                : 'text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExperiments.map(experiment => (
          <div
            key={experiment.id}
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden hover:border-[#333] transition-colors group"
          >
            {/* Preview */}
            <div className="h-32 bg-[#161616] border-b border-[#1a1a1a] flex items-center justify-center">
              {experiment.preview ? (
                <img 
                  src={experiment.preview} 
                  alt={`${experiment.title} preview`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-[#525252] text-center">
                  <Code size={24} className="mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No preview</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-[#f5f5f5] group-hover:text-blue-400 transition-colors">
                  {experiment.title}
                </h3>
                <span className="px-2 py-1 text-xs bg-[#1a1a1a] text-[#737373] rounded">
                  {experiment.language}
                </span>
              </div>
              
              <p className="text-sm text-[#737373] mb-3 line-clamp-2">
                {experiment.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {experiment.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-[#161616] text-[#666] rounded">
                    #{tag}
                  </span>
                ))}
                {experiment.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs text-[#666]">
                    +{experiment.tags.length - 3}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyCode(experiment.code, experiment.title)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#737373] hover:text-[#f5f5f5] hover:bg-[#161616] rounded transition-colors"
                >
                  <Copy size={14} />
                  Copy
                </button>
                <button
                  onClick={() => handleOpenInEditor(experiment)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                >
                  <ExternalLink size={14} />
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredExperiments.length === 0 && (
        <div className="text-center py-12">
          <Folder size={48} className="mx-auto mb-4 text-[#525252] opacity-50" />
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-2">No experiments found</h3>
          <p className="text-[#737373] text-sm">
            {searchTerm ? "Try adjusting your search terms" : "Try selecting a different category"}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
        <div className="flex flex-wrap gap-4 text-sm text-[#737373]">
          <span>Total Experiments: <span className="text-[#f5f5f5]">{EXPERIMENTS.length}</span></span>
          <span>Showing: <span className="text-[#f5f5f5]">{filteredExperiments.length}</span></span>
          <span>Categories: <span className="text-[#f5f5f5]">{CATEGORIES.length - 1}</span></span>
        </div>
      </div>
    </div>
  );
}