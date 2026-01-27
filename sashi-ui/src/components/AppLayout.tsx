"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0c0c0c] border-b border-[#1a1a1a] flex items-center px-4 z-30">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-[#737373] hover:text-[#f5f5f5]"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <img 
            src="/sashi-avatar.png" 
            alt="Sashi" 
            className="w-6 h-6 rounded object-cover grayscale"
          />
          <span className="font-display text-base text-[#f5f5f5]">Sashi</span>
        </div>
      </header>

      <main className="lg:ml-[200px] pt-14 lg:pt-0">
        {(title || subtitle) && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 lg:pb-6">
            {title && (
              <h1 className="font-display text-xl sm:text-2xl font-medium text-[#f5f5f5] tracking-tight">{title}</h1>
            )}
            {subtitle && (
              <p className="text-xs text-[#525252] mt-1">{subtitle}</p>
            )}
          </div>
        )}
        <div className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
