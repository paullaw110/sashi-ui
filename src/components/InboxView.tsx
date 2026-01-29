"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Link, FileText, Lightbulb, CheckSquare, Trash2, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichEditor } from "./RichEditor";

type InboxItem = {
  id: string;
  content: string;
  type: string;
  url: string | null;
  metadata: string | null;
  createdAt: Date;
};

interface InboxViewProps {
  items: InboxItem[];
}

const ITEM_TYPES = [
  { value: "note", label: "Note", icon: FileText },
  { value: "bookmark", label: "Link", icon: Link },
  { value: "idea", label: "Idea", icon: Lightbulb },
  { value: "task", label: "Task", icon: CheckSquare },
];

function getTypeIcon(type: string) {
  const typeConfig = ITEM_TYPES.find(t => t.value === type);
  if (!typeConfig) return FileText;
  return typeConfig.icon;
}

export function InboxView({ items }: InboxViewProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedEditor, setExpandedEditor] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // For rich editor, strip HTML to check if empty
    const textContent = expandedEditor 
      ? content.replace(/<[^>]*>/g, "").trim()
      : content.trim();
    if (!textContent) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: expandedEditor ? content : content.trim(),
          type,
          url: url.trim() || null,
        }),
      });
      setContent("");
      setUrl("");
      setExpandedEditor(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  }, [content, type, url, router, expandedEditor]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/inbox/${id}`, { method: "DELETE" });
    router.refresh();
  }, [router]);

  const handleContentChange = (value: string) => {
    setContent(value);
    const urlMatch = value.match(/https?:\/\/[^\s]+/);
    if (urlMatch && type === "note") {
      setType("bookmark");
      setUrl(urlMatch[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Capture */}
      <div className="bg-[#111] rounded-lg border border-[#1a1a1a] p-5">
        <form onSubmit={handleSubmit}>
          {expandedEditor ? (
            <RichEditor
              content={content}
              onChange={setContent}
              placeholder="Capture a thought..."
              className="border-0 -mx-1"
            />
          ) : (
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Capture a thought..."
              rows={2}
              className="w-full px-0 py-0 bg-transparent text-[#e5e5e5] text-sm placeholder:text-[#333] focus:outline-none resize-none"
              autoFocus
            />
          )}
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1a1a1a]">
            <div className="flex items-center gap-1">
              {ITEM_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] transition-colors",
                      type === t.value
                        ? "bg-[#222] text-[#e5e5e5]"
                        : "text-[#404040] hover:text-[#737373]"
                    )}
                  >
                    <Icon size={12} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedEditor(!expandedEditor)}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  expandedEditor
                    ? "bg-[#222] text-[#e5e5e5]"
                    : "text-[#404040] hover:text-[#737373]"
                )}
                title={expandedEditor ? "Simple editor" : "Rich editor"}
              >
                {expandedEditor ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <button
                type="submit"
                disabled={(!expandedEditor && !content.trim()) || (expandedEditor && !content.replace(/<[^>]*>/g, "").trim()) || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e5e5e5] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed rounded text-[11px] text-[#0c0c0c] transition-colors"
              >
                <Plus size={12} />
                {isSubmitting ? "..." : "Capture"}
              </button>
            </div>
          </div>

          {type === "bookmark" && (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              className="w-full mt-3 px-3 py-2 bg-[#161616] border border-[#222] rounded text-[#a3a3a3] text-xs placeholder:text-[#333] focus:outline-none focus:border-[#333] transition-colors"
            />
          )}
        </form>
      </div>

      {/* Items List */}
      <div className="bg-[#111] rounded-lg border border-[#1a1a1a]">
        <div className="px-4 py-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base text-[#f5f5f5]">Items</h2>
            <span className="text-[10px] text-[#404040]">{items.length}</span>
          </div>
        </div>

        <div className="divide-y divide-[#161616]">
          {items.map((item) => {
            const Icon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                className="px-4 py-3 hover:bg-[#161616] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <Icon size={14} className="text-[#404040] mt-0.5 shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#a3a3a3] whitespace-pre-wrap break-words">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-[#333]">
                        {format(new Date(item.createdAt), "MMM d")}
                      </span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-[#404040] hover:text-[#737373]"
                        >
                          <ExternalLink size={10} />
                          {new URL(item.url).hostname}
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-[#333] hover:text-[#737373] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="px-4 py-10 text-center text-[#333] text-xs">
              Nothing captured yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
