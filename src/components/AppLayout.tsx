"use client";

import { useState, useEffect } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { QuickAddTask } from "./QuickAddTask";
import { CommandPalette } from "./CommandPalette";
import { TauriEventListener } from "./TauriEventListener";
import { SyncIndicator } from "./SyncIndicator";
import { UpdateChecker } from "./UpdateChecker";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile overlay state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize sidebar state from localStorage and detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // On mobile, always start collapsed
        setSidebarCollapsed(true);
      } else {
        // On desktop, restore from localStorage
        const stored = localStorage.getItem('sidebar-collapsed');
        setSidebarCollapsed(stored === 'true');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Persist sidebar state to localStorage (only for desktop)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed, isMobile]);

  // Toggle sidebar collapse (for desktop)
  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Cmd+N / Ctrl+N for quick add task
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setQuickAddOpen(true);
      }
      
      // Cmd+B / Ctrl+B for sidebar toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isMobile, sidebarOpen, sidebarCollapsed]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={isMobile}
      />
      
      {/* Header - shown when sidebar is collapsed or on mobile */}
      <header className={`fixed top-0 left-0 right-0 h-14 bg-[var(--bg-base)] border-b border-[var(--border-default)] flex items-center px-4 z-30 transition-all duration-300 ${
        isMobile || sidebarCollapsed ? 'block' : 'hidden'
      }`}>
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Open sidebar'}
        >
          {isMobile ? <Menu size={20} /> : (sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />)}
        </button>
        <div className="flex items-center gap-2 ml-2">
          <img 
            src="/sashi-avatar.png" 
            alt="Sashi" 
            className="w-6 h-6 rounded-lg object-cover grayscale"
          />
          <span className="font-display text-base text-[var(--text-primary)]">Sashi</span>
        </div>
        
        {/* Sync indicator - shows in Tauri app */}
        <div className="ml-auto">
          <SyncIndicator />
        </div>
      </header>

      <main className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ${
        isMobile 
          ? 'pt-14' 
          : sidebarCollapsed 
            ? 'pt-14' 
            : 'ml-[256px] pt-0'
      }`}>
        {(title || subtitle) && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 lg:pb-6 shrink-0">
            {title && (
              <h1 className="font-display text-display text-[var(--text-primary)] tracking-tight">{title}</h1>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--text-quaternary)] mt-1">{subtitle}</p>
            )}
          </div>
        )}
        <div className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8 flex-1 min-h-0 flex flex-col overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Quick Add Task Modal */}
      <QuickAddTask
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette onCreateTask={() => setQuickAddOpen(true)} />

      {/* Tauri Event Listener for native app integration */}
      <TauriEventListener 
        onQuickAdd={() => setQuickAddOpen(true)}
        onOpenSettings={() => {
          // Navigate to settings or open settings modal
          window.location.href = "/settings";
        }}
      />

      {/* Update notification for Tauri app */}
      <UpdateChecker />
    </div>
  );
}
