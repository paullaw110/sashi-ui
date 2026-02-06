"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  Calendar, 
  Radar,
  FileText,
  CheckSquare,
  Settings,
  Search,
  Target,
  X,
  Code2,
  BookOpen,
  PanelLeftClose,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusIndicator } from "./StatusIndicator";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/playground", icon: Code2, label: "Code Playground" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/mission-control", icon: Radar, label: "Mission Control" },
  { href: "/library", icon: BookOpen, label: "Library" },
  { href: "/leads", icon: Target, label: "Leads" },
];

type Organization = {
  id: string;
  name: string;
  icon: string | null;
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  isCollapsed = false, 
  onToggleCollapse, 
  isMobile = false 
}: SidebarProps) {
  const pathname = usePathname();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgsExpanded, setOrgsExpanded] = useState(true);

  // Fetch organizations on mount
  useEffect(() => {
    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => setOrganizations(data.organizations || []))
      .catch(() => {});
  }, []);

  // On mobile, use overlay behavior. On desktop, use collapse behavior
  const shouldShow = isMobile ? isOpen : !isCollapsed;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "w-[256px] h-screen bg-[var(--bg-base)] border-r border-[var(--border-subtle)] flex flex-col fixed left-0 top-0 z-50",
        "transition-all duration-300 ease-in-out",
        isMobile 
          ? cn("lg:hidden", isOpen ? "translate-x-0" : "-translate-x-full")
          : cn("hidden lg:flex", isCollapsed ? "-translate-x-full" : "translate-x-0")
      )}>
        {/* Logo + Status */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
              <img 
                src="/sashi-avatar.png" 
                alt="Sashi" 
                className="w-7 h-7 rounded-lg object-cover grayscale"
              />
              <span className="font-display text-lg text-[var(--text-primary)]">Sashi</span>
            </Link>
            <div className="flex items-center gap-1">
              {/* Desktop collapse button */}
              {!isMobile && onToggleCollapse && (
                <button 
                  onClick={onToggleCollapse}
                  className="p-1.5 text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                  title="Collapse sidebar (⌘B)"
                >
                  <PanelLeftClose size={18} />
                </button>
              )}
              {/* Mobile close button */}
              {isMobile && (
                <button 
                  onClick={onClose}
                  className="p-1.5 text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)]"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2">
            <StatusIndicator />
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-quaternary)] text-xs rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-tertiary)] transition-colors">
            <Search size={13} />
            <span>Search</span>
            <kbd className="ml-auto text-[9px] text-[var(--text-quaternary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded hidden sm:inline">⌘K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                  isActive 
                    ? "bg-[var(--bg-hover)] text-[var(--text-primary)]" 
                    : "text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Icon size={15} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}

          {/* Organizations Section */}
          {organizations.length > 0 && (
            <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setOrgsExpanded(!orgsExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={12} />
                  Organizations
                </span>
                {orgsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              
              {orgsExpanded && (
                <div className="space-y-0.5 mt-1">
                  {organizations.map((org) => {
                    const isActive = pathname === `/organizations/${org.id}`;
                    return (
                      <Link
                        key={org.id}
                        href={`/organizations/${org.id}`}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                          isActive 
                            ? "bg-[var(--bg-hover)] text-[var(--text-primary)]" 
                            : "text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]"
                        )}
                      >
                        <span className="w-4 text-center">
                          {org.icon || "🏢"}
                        </span>
                        <span className="truncate">{org.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)]">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-quaternary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-tertiary)] transition-colors">
            <Settings size={15} strokeWidth={1.5} />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
