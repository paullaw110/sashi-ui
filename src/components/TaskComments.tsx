"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface Comment {
  id: string;
  taskId: string;
  agentId: string;
  content: string;
  attachments: string | null;
  createdAt: string;
  agent: Agent | null;
}

interface TaskCommentsProps {
  taskId: string;
  currentAgentId?: string; // Which agent is commenting (default: "sashi")
}

export function TaskComments({ taskId, currentAgentId = "sashi" }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    refetchInterval: 10000, // Poll for new comments
  });

  // Fetch agents for mentions
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  // Post comment mutation
  const postMutation = useMutation({
    mutationFn: async (commentContent: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: currentAgentId, content: commentContent }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      setContent("");
    },
  });

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  // Handle mention insertion
  const insertMention = (agent: Agent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(textarea.selectionEnd);
    
    // Check if we need to add a space before @
    const needsSpace = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n");
    const mention = `${needsSpace ? " " : ""}@${agent.name} `;
    
    setContent(before + mention + after);
    setShowMentionPicker(false);
    
    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      const newPos = start + mention.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    postMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Parse @mentions in content for highlighting
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="text-lime-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1">
        {comments.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">
            No comments yet. Start the conversation.
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="text-lg shrink-0">{comment.agent?.avatar || "👤"}</div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-zinc-200 text-sm">
                      {comment.agent?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-0.5 whitespace-pre-wrap break-words">
                    {renderContent(comment.content)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mt-4 border-t border-zinc-800 pt-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... (⌘+Enter to send)"
            className="min-h-[80px] pr-20 resize-none bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {/* Mention button */}
            <DropdownMenu open={showMentionPicker} onOpenChange={setShowMentionPicker}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300"
                >
                  <AtSign className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {agents
                  .filter((a) => a.id !== currentAgentId)
                  .map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => insertMention(agent)}
                      className="flex items-center gap-2"
                    >
                      <span className="text-base">{agent.avatar}</span>
                      <div>
                        <div className="text-sm">{agent.name}</div>
                        <div className="text-xs text-zinc-500">{agent.role}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Send button */}
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || postMutation.isPending}
              className={cn(
                "h-7 w-7 p-0",
                content.trim()
                  ? "bg-lime-400 hover:bg-lime-500 text-black"
                  : "bg-zinc-800 text-zinc-600"
              )}
            >
              {postMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
