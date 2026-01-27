"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichEditor } from "./RichEditor";

type Note = {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface NotesViewProps {
  notes: Note[];
}

export function NotesView({ notes: initialNotes }: NotesViewProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(
    initialNotes.length > 0 ? initialNotes[0] : null
  );
  const [title, setTitle] = useState(selectedNote?.title || "");
  const [content, setContent] = useState(selectedNote?.content || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update local state when notes prop changes
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  // Update editor when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content || "");
    }
  }, [selectedNote?.id]);

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const saveNote = useCallback(async (noteId: string, updates: { title?: string; content?: string }) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (res.ok) {
        const { note: updatedNote } = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? updatedNote : n))
        );
        if (selectedNote?.id === noteId) {
          setSelectedNote(updatedNote);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [selectedNote?.id]);

  const handleAutoSave = useCallback((field: "title" | "content", value: string) => {
    if (!selectedNote) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNote(selectedNote.id, { [field]: value });
    }, 800);
  }, [selectedNote, saveNote]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    handleAutoSave("title", value);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    handleAutoSave("content", value);
  };

  const createNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", content: "" }),
      });

      if (res.ok) {
        const { note } = await res.json();
        setNotes((prev) => [note, ...prev]);
        setSelectedNote(note);
        setTitle(note.title);
        setContent(note.content || "");
        // Focus title input after creation
        setTimeout(() => titleInputRef.current?.select(), 100);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;

    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const newNotes = notes.filter((n) => n.id !== id);
      setNotes(newNotes);

      if (selectedNote?.id === id) {
        setSelectedNote(newNotes.length > 0 ? newNotes[0] : null);
        if (newNotes.length > 0) {
          setTitle(newNotes[0].title);
          setContent(newNotes[0].content || "");
        }
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const getPreview = (content: string | null) => {
    if (!content) return "No content";
    // Strip HTML tags for preview
    const text = content.replace(/<[^>]*>/g, "").trim();
    return text.length > 60 ? text.slice(0, 60) + "..." : text || "No content";
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Notes List */}
      <div className="w-72 flex flex-col bg-[#111] rounded-lg border border-[#1a1a1a]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-base text-[#f5f5f5]">Notes</span>
            <span className="text-[10px] text-[#404040]">{notes.length}</span>
          </div>
          <button
            onClick={createNote}
            className="p-1.5 text-[#404040] hover:text-[#737373] hover:bg-[#1a1a1a] rounded transition-colors"
            title="New note"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[#1a1a1a]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#404040]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-7 pr-3 py-1.5 bg-[#161616] border border-[#222] rounded text-[#a3a3a3] text-xs placeholder:text-[#333] focus:outline-none focus:border-[#333] transition-colors"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={cn(
                "w-full px-4 py-3 text-left border-b border-[#161616] transition-colors group cursor-pointer",
                selectedNote?.id === note.id
                  ? "bg-[#1a1a1a]"
                  : "hover:bg-[#161616]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-[#404040] shrink-0" />
                    <span className="text-xs text-[#e5e5e5] truncate">
                      {note.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#404040] mt-1 truncate pl-5">
                    {getPreview(note.content)}
                  </p>
                  <span className="text-[9px] text-[#333] mt-1 block pl-5">
                    {format(new Date(note.updatedAt), "MMM d, yyyy")}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="p-1 text-[#333] hover:text-[#737373] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-[#333] text-xs">
                {searchQuery ? "No matching notes" : "No notes yet"}
              </p>
              {!searchQuery && (
                <button
                  onClick={createNote}
                  className="mt-3 text-[10px] text-[#525252] hover:text-[#737373] transition-colors"
                >
                  Create your first note
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-[#111] rounded-lg border border-[#1a1a1a]">
        {selectedNote ? (
          <>
            {/* Title */}
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title"
                className="flex-1 bg-transparent text-lg font-display text-[#f5f5f5] placeholder:text-[#333] focus:outline-none"
              />
              <div className="flex items-center gap-3">
                {isSaving && (
                  <span className="text-[9px] text-[#404040]">Saving...</span>
                )}
                <span className="text-[9px] text-[#333]">
                  Updated {format(new Date(selectedNote.updatedAt), "MMM d, h:mm a")}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <RichEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Start writing..."
                className="border-0 rounded-none h-full"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={32} className="mx-auto text-[#222] mb-3" />
              <p className="text-[#404040] text-xs">Select a note or create a new one</p>
              <button
                onClick={createNote}
                className="mt-4 flex items-center gap-1.5 mx-auto px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] rounded text-[10px] text-[#737373] transition-colors"
              >
                <Plus size={12} />
                New note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
