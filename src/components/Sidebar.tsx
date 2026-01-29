"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Inbox, 
  Calendar, 
  ListTodo,
  FileText,
  CheckSquare,
  Settings,
  Search,
  Target,
  X,
  Code2,
  Zap,
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
  { href: "/queue", icon: ListTodo, label: "Queue" },
  { href: "/skills", icon: Zap, label: "Skills" },
  { href: "/leads", icon: Target, label: "Leads" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "w-[200px] h-screen bg-[#0c0c0c] border-r border-[#1a1a1a] flex flex-col fixed left-0 top-0 z-50",
        "transition-transform duration-200 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo + Status */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
              <img 
                src="/sashi-avatar.png" 
                alt="Sashi" 
                className="w-7 h-7 rounded object-cover grayscale"
              />
              <span className="font-display text-lg text-[#f5f5f5]">Sashi</span>
            </Link>
            <button 
              onClick={onClose}
              className="lg:hidden p-1 text-[#525252] hover:text-[#737373]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-2">
            <StatusIndicator />
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-[#525252] text-xs rounded border border-[#1a1a1a] hover:border-[#333] hover:text-[#737373] transition-colors">
            <Search size={13} />
            <span>Search</span>
            <kbd className="ml-auto text-[9px] text-[#404040] bg-[#161616] px-1.5 py-0.5 rounded hidden sm:inline">⌘K</kbd>
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
                  "flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors",
                  isActive 
                    ? "bg-[#1c1c1c] text-[#f5f5f5]" 
                    : "text-[#737373] hover:bg-[#161616] hover:text-[#a3a3a3]"
                )}
              >
                <Icon size={15} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#1a1a1a]">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs text-[#525252] hover:bg-[#161616] hover:text-[#737373] transition-colors">
            <Settings size={15} strokeWidth={1.5} />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
