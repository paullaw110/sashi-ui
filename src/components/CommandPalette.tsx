"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FileText,
  Inbox,
  Users,
  ListTodo,
  Sparkles,
  Code,
  Plus,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandPaletteProps {
  onCreateTask?: () => void;
  onCreateOrganization?: () => void;
}

export function CommandPalette({ onCreateTask, onCreateOrganization }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/tasks"))}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Tasks
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/notes"))}>
            <FileText className="mr-2 h-4 w-4" />
            Notes
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/inbox"))}>
            <Inbox className="mr-2 h-4 w-4" />
            Inbox
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/leads"))}>
            <Users className="mr-2 h-4 w-4" />
            Leads
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/queue"))}>
            <ListTodo className="mr-2 h-4 w-4" />
            Queue
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/skills"))}>
            <Sparkles className="mr-2 h-4 w-4" />
            Skills
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/playground"))}>
            <Code className="mr-2 h-4 w-4" />
            Playground
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {onCreateTask && (
            <CommandItem onSelect={() => runCommand(onCreateTask)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </CommandItem>
          )}
          {onCreateOrganization && (
            <CommandItem onSelect={() => runCommand(onCreateOrganization)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
