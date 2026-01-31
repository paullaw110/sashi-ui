"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Code, 
  Link as LinkIcon,
  Unlink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";

interface RichEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  className?: string;
  minimal?: boolean;
}

export function RichEditor({ 
  content = "", 
  placeholder = "Start writing...",
  onChange,
  editable = true,
  className,
  minimal = false,
}: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#737373] underline hover:text-[#a3a3a3] transition-colors",
        },
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "focus:outline-none min-h-[80px] text-sm text-[#e5e5e5]",
          "prose prose-invert prose-sm max-w-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_li]:text-[#a3a3a3] [&_p]:text-[#a3a3a3] [&_p]:leading-relaxed",
          "[&_code]:bg-[#1a1a1a] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#737373] [&_code]:text-xs",
          "[&_.is-editor-empty:first-child::before]:text-[#333] [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children,
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive 
          ? "bg-[#222] text-[#e5e5e5]" 
          : "text-[#404040] hover:text-[#737373] hover:bg-[#1a1a1a]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("bg-[#111] border border-[#1a1a1a] rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      {!minimal && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#1a1a1a] bg-[#0c0c0c]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </ToolbarButton>
          
          <div className="w-px h-4 bg-[#222] mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrdered size={14} />
          </ToolbarButton>
          
          <div className="w-px h-4 bg-[#222] mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Code"
          >
            <Code size={14} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive("link")}
            title="Add link"
          >
            <LinkIcon size={14} />
          </ToolbarButton>
          
          {editor.isActive("link") && (
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove link"
            >
              <Unlink size={14} />
            </ToolbarButton>
          )}
        </div>
      )}
      
      {/* Editor */}
      <div className={cn("px-4 py-3", minimal && "px-3 py-2")}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
