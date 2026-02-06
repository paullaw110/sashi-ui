import { AppLayout } from "@/components/AppLayout";
import Link from "next/link";
import { FileText, Palette, Mail, ArrowRight } from "lucide-react";

const TOOLS = [
  {
    id: "brief-generator",
    name: "Brief Generator",
    description: "Create comprehensive website briefs using the 8-phase SuperLandings workflow",
    icon: FileText,
    href: "/tools/brief-generator",
    status: "active",
  },
  {
    id: "design-system",
    name: "Design System",
    description: "Generate color palettes, typography, and visual direction",
    icon: Palette,
    href: "/tools/design-system",
    status: "coming-soon",
  },
  {
    id: "outreach",
    name: "Outreach Generator",
    description: "Create personalized cold emails and follow-up sequences",
    icon: Mail,
    href: "/tools/outreach",
    status: "coming-soon",
  },
];

export default function ToolsPage() {
  return (
    <AppLayout title="Tools" subtitle="SuperLandings workflow tools">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = tool.status === "active";
          
          return (
            <Link
              key={tool.id}
              href={isActive ? tool.href : "#"}
              className={`
                group relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] 
                rounded-xl p-6 transition-all duration-200
                ${isActive 
                  ? "hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
                }
              `}
            >
              {/* Icon */}
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-4
                ${isActive ? "bg-[var(--accent-muted)]" : "bg-[var(--bg-hover)]"}
              `}>
                <Icon 
                  size={20} 
                  className={isActive ? "text-[var(--accent)]" : "text-[var(--text-quaternary)]"} 
                />
              </div>
              
              {/* Content */}
              <h3 className="font-display text-base text-[var(--text-primary)] mb-2">
                {tool.name}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                {tool.description}
              </p>
              
              {/* Status badge */}
              {!isActive && (
                <span className="absolute top-4 right-4 text-[9px] uppercase tracking-wider text-[var(--text-quaternary)] bg-[var(--bg-hover)] px-2 py-1 rounded">
                  Coming Soon
                </span>
              )}
              
              {/* Arrow */}
              {isActive && (
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} className="text-[var(--text-tertiary)]" />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </AppLayout>
  );
}
