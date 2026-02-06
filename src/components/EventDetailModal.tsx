"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Trash2,
  MoreHorizontal,
  X,
  Repeat,
  Palette,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PropertyRow } from "./PropertyRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { RichEditor } from "./RichEditor";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { toast } from "sonner";
import { CalendarEvent, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/lib/hooks/use-events";

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  isCreating?: boolean;
  defaultDate?: Date | null;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
  onClose: () => void;
}

const EVENT_COLORS = [
  { value: "#EFFF83", label: "Volt" },   // Brand color - default
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

export function EventDetailModal({
  event,
  isOpen,
  isCreating = false,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onClose,
}: EventDetailModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState("#EFFF83");
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track if this is a newly created event
  const [localEventId, setLocalEventId] = useState<string | null>(null);
  const hasCreatedRef = useRef(false);

  // Edit mode for recurring events
  const [editMode, setEditMode] = useState<"all" | "thisAndFuture" | "single">("all");
  const [showEditModeSelector, setShowEditModeSelector] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<Partial<CalendarEvent> | null>(null);

  // Popover states
  const [dateOpen, setDateOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);

  // React Query mutations
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setName(event.name);
      setStartDate(new Date(event.startDate));
      setStartTime(event.startTime || "");
      setEndTime(event.endTime || "");
      setLocation(event.location || "");
      setDescription(event.description || "");
      setIsAllDay(event.isAllDay);
      setColor(event.color || "#EFFF83");
      setRecurrenceRule(event.recurrenceRule);
      setLocalEventId(event.id);
      hasCreatedRef.current = true;
    } else {
      // Reset for new event
      setName("");
      setStartDate(defaultDate || new Date());
      setStartTime(defaultStartTime || "09:00");
      setEndTime(defaultEndTime || "10:00");
      setLocation("");
      setDescription("");
      setIsAllDay(false);
      setColor("#EFFF83");
      setRecurrenceRule(null);
      setLocalEventId(null);
      hasCreatedRef.current = false;
    }
  }, [event, isOpen, defaultDate, defaultStartTime, defaultEndTime]);

  // Check if this is a recurring event instance
  const isRecurringInstance = event?.isRecurringInstance && event?.recurrenceRule;

  // Auto-save function for existing events
  const autoSave = useCallback(async (updates: Partial<CalendarEvent>, forceEditMode?: "all" | "thisAndFuture" | "single") => {
    const eventId = localEventId || event?.id;
    if (!eventId) return;

    // If this is a recurring instance and we haven't chosen edit mode yet, show selector
    if (isRecurringInstance && !forceEditMode) {
      setPendingUpdate(updates);
      setShowEditModeSelector(true);
      return;
    }

    setIsSaving(true);
    try {
      const mode = forceEditMode || editMode;
      const instanceDate = event?.instanceDate ? format(new Date(event.instanceDate), "yyyy-MM-dd") : undefined;
      await updateEvent.mutateAsync({
        id: eventId,
        editMode: isRecurringInstance ? mode : "all",
        date: instanceDate,
        ...updates,
      });
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [localEventId, event?.id, event?.instanceDate, updateEvent, editMode, isRecurringInstance]);

  // Handle edit mode selection for pending update
  const handleEditModeConfirm = useCallback(async (mode: "all" | "thisAndFuture" | "single") => {
    setEditMode(mode);
    setShowEditModeSelector(false);
    if (pendingUpdate) {
      await autoSave(pendingUpdate, mode);
      setPendingUpdate(null);
    }
  }, [pendingUpdate, autoSave]);

  // Create new event when name is entered
  const createNewEvent = useCallback(async (eventName: string) => {
    if (!eventName.trim() || hasCreatedRef.current) return;

    hasCreatedRef.current = true;
    setIsSaving(true);
    try {
      const result = await createEvent.mutateAsync({
        name: eventName.trim(),
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        startTime: isAllDay ? null : startTime || null,
        endTime: isAllDay ? null : endTime || null,
        location: location || null,
        description: description || null,
        isAllDay,
        color,
        recurrenceRule,
        recurrenceEnd: null,
      });

      if (result?.event?.id) {
        setLocalEventId(result.event.id);
      }
    } catch (error) {
      hasCreatedRef.current = false;
      toast.error("Failed to create event");
    } finally {
      setIsSaving(false);
    }
  }, [startDate, startTime, endTime, location, description, isAllDay, color, recurrenceRule, createEvent]);

  // Handle name blur - create event if new, or save if existing
  const handleNameBlur = useCallback(() => {
    if (isCreating && !hasCreatedRef.current && name.trim()) {
      createNewEvent(name);
    } else if (hasCreatedRef.current && name.trim()) {
      autoSave({ name: name.trim() });
    }
  }, [isCreating, name, createNewEvent, autoSave]);

  // Handle field changes with auto-save
  const handleDateChange = useCallback((newDate: Date | undefined) => {
    setStartDate(newDate);
    if (hasCreatedRef.current && newDate) {
      autoSave({ startDate: format(newDate, "yyyy-MM-dd") });
    }
  }, [autoSave]);

  const handleStartTimeChange = useCallback((newTime: string) => {
    setStartTime(newTime);
    if (hasCreatedRef.current) {
      autoSave({ startTime: newTime || null });
    }
  }, [autoSave]);

  const handleEndTimeChange = useCallback((newTime: string) => {
    setEndTime(newTime);
    if (hasCreatedRef.current) {
      autoSave({ endTime: newTime || null });
    }
  }, [autoSave]);

  const handleLocationChange = useCallback((newLocation: string) => {
    setLocation(newLocation);
  }, []);

  const handleLocationBlur = useCallback(() => {
    if (hasCreatedRef.current) {
      autoSave({ location: location || null });
    }
  }, [location, autoSave]);

  const handleAllDayChange = useCallback((checked: boolean) => {
    setIsAllDay(checked);
    if (hasCreatedRef.current) {
      autoSave({
        isAllDay: checked,
        startTime: checked ? null : startTime,
        endTime: checked ? null : endTime,
      });
    }
  }, [startTime, endTime, autoSave]);

  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor);
    setColorOpen(false);
    if (hasCreatedRef.current) {
      autoSave({ color: newColor });
    }
  }, [autoSave]);

  const handleRecurrenceChange = useCallback((newRule: string | null) => {
    setRecurrenceRule(newRule);
    setRecurrenceOpen(false);
    if (hasCreatedRef.current) {
      autoSave({ recurrenceRule: newRule });
    }
  }, [autoSave]);

  // Debounced description save
  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleDescriptionChange = useCallback((newDescription: string) => {
    setDescription(newDescription);

    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }

    if (hasCreatedRef.current) {
      descriptionTimeoutRef.current = setTimeout(() => {
        autoSave({ description: newDescription || null });
      }, 500);
    }
  }, [autoSave]);

  // Delete mode state for recurring events
  const [showDeleteModeSelector, setShowDeleteModeSelector] = useState(false);

  const handleDelete = async (deleteMode?: "all" | "thisAndFuture" | "single") => {
    const eventId = localEventId || event?.id;
    if (!eventId) return;

    // If this is a recurring instance and we haven't chosen delete mode yet, show selector
    if (isRecurringInstance && !deleteMode) {
      setShowDeleteModeSelector(true);
      return;
    }

    setIsDeleting(true);
    try {
      const instanceDate = event?.instanceDate ? format(new Date(event.instanceDate), "yyyy-MM-dd") : undefined;
      await deleteEvent.mutateAsync({
        eventId,
        deleteMode: isRecurringInstance ? (deleteMode || "all") : "all",
        date: instanceDate,
      });
      onClose();
    } catch (error) {
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
      setShowDeleteModeSelector(false);
    }
  };

  const selectedColor = EVENT_COLORS.find((c) => c.value === color) || EVENT_COLORS[0];

  // Get recurrence display text
  const getRecurrenceText = () => {
    if (!recurrenceRule) return "Does not repeat";
    if (recurrenceRule.includes("FREQ=DAILY")) return "Daily";
    if (recurrenceRule.includes("FREQ=WEEKLY")) {
      if (recurrenceRule.includes("BYDAY=")) {
        const days = recurrenceRule.match(/BYDAY=([A-Z,]+)/)?.[1];
        if (days === "MO,TU,WE,TH,FR") return "Weekdays";
        if (days === "SA,SU") return "Weekends";
        return `Weekly on ${days}`;
      }
      return "Weekly";
    }
    if (recurrenceRule.includes("FREQ=MONTHLY")) return "Monthly";
    if (recurrenceRule.includes("FREQ=YEARLY")) return "Yearly";
    return "Custom";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        {/* Custom header with More and Close buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-quaternary)] mr-2">
              <Loader2 size={12} className="animate-spin" />
              Saving...
            </div>
          )}
          {/* Three-dot menu for delete */}
          {(event || localEventId) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  tabIndex={-1}
                >
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[var(--border-strong)]">
                <DropdownMenuItem
                  onClick={() => handleDelete()}
                  disabled={isDeleting}
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Trash2 size={14} className="mr-2" />
                  )}
                  Delete event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <DialogHeader className="pb-4 pr-24">
          <DialogTitle className="sr-only">
            {isCreating ? "New Event" : "Edit Event"}
          </DialogTitle>
          {/* Color indicator + Editable Title */}
          <div className="flex items-start gap-3">
            <div
              className="w-4 h-4 rounded-full mt-3 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Event name..."
              autoFocus
              className="text-4xl font-bold border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-[var(--text-quaternary)]"
            />
          </div>
        </DialogHeader>

        <div className="space-y-1">
          {/* Date */}
          <PropertyRow icon={Calendar} label="Date" isEmpty={!startDate}>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button className="text-sm hover:bg-[var(--bg-surface)] px-2 py-1 rounded -ml-2 transition-colors text-left">
                  {startDate ? format(startDate, "EEEE, MMMM d, yyyy") : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[var(--bg-surface)] border-[var(--border-strong)]" align="start">
                <CalendarPicker
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    handleDateChange(date);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </PropertyRow>

          {/* All Day Toggle */}
          <PropertyRow icon={Clock} label="All day">
            <div className="flex items-center gap-2 -ml-2 px-2 py-1">
              <Switch
                checked={isAllDay}
                onCheckedChange={handleAllDayChange}
              />
              <span className="text-sm text-[var(--text-tertiary)]">
                {isAllDay ? "Yes" : "No"}
              </span>
            </div>
          </PropertyRow>

          {/* Time (only show if not all-day) */}
          {!isAllDay && (
            <PropertyRow icon={Clock} label="Time" isEmpty={!startTime && !endTime}>
              <div className="flex items-center gap-2 -ml-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="h-8 w-auto border-none bg-transparent hover:bg-[var(--bg-surface)] px-2"
                />
                <span className="text-[var(--text-quaternary)]">–</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="h-8 w-auto border-none bg-transparent hover:bg-[var(--bg-surface)] px-2"
                />
              </div>
            </PropertyRow>
          )}

          {/* Location */}
          <PropertyRow icon={MapPin} label="Location" isEmpty={!location}>
            <Input
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onBlur={handleLocationBlur}
              placeholder="Add location..."
              className="h-8 border-none bg-transparent hover:bg-[var(--bg-surface)] px-2 -ml-2"
            />
          </PropertyRow>

          {/* Color */}
          <PropertyRow icon={Palette} label="Color">
            <Popover open={colorOpen} onOpenChange={setColorOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 text-sm hover:bg-[var(--bg-surface)] px-2 py-1 rounded -ml-2 transition-colors">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {selectedColor.label}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-[var(--bg-surface)] border-[var(--border-strong)]" align="start">
                <div className="grid grid-cols-4 gap-2">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleColorChange(c.value)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform hover:scale-110",
                        color === c.value && "ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-surface)]"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </PropertyRow>

          {/* Recurrence */}
          <PropertyRow icon={Repeat} label="Repeat" isEmpty={!recurrenceRule}>
            <Popover open={recurrenceOpen} onOpenChange={setRecurrenceOpen}>
              <PopoverTrigger asChild>
                <button className="text-sm hover:bg-[var(--bg-surface)] px-2 py-1 rounded -ml-2 transition-colors text-left">
                  {getRecurrenceText()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 bg-[var(--bg-surface)] border-[var(--border-strong)]" align="start">
                <RecurrenceEditor
                  value={recurrenceRule}
                  onChange={handleRecurrenceChange}
                  startDate={startDate || new Date()}
                />
              </PopoverContent>
            </Popover>
          </PropertyRow>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-default)] my-4" />

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Description</h3>
          <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] min-h-[120px]">
            <RichEditor
              content={description}
              onChange={handleDescriptionChange}
              placeholder="Add event description..."
              minimal
            />
          </div>
        </div>

        {/* Create button for new events without a name yet */}
        {isCreating && !hasCreatedRef.current && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <Button
              onClick={() => name.trim() && createNewEvent(name)}
              disabled={!name.trim() || isSaving}
              className="w-full"
            >
              {isSaving && <Loader2 size={14} className="animate-spin mr-2" />}
              Create Event
            </Button>
          </div>
        )}

        {/* Edit mode selector for recurring events */}
        {showEditModeSelector && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg p-4 w-[320px] shadow-xl">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Edit recurring event</h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">This is a recurring event. How would you like to apply your changes?</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleEditModeConfirm("single")}
                >
                  This event only
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleEditModeConfirm("thisAndFuture")}
                >
                  This and following events
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleEditModeConfirm("all")}
                >
                  All events in series
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => {
                  setShowEditModeSelector(false);
                  setPendingUpdate(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Delete mode selector for recurring events */}
        {showDeleteModeSelector && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg p-4 w-[320px] shadow-xl">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Delete recurring event</h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">This is a recurring event. What would you like to delete?</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => handleDelete("single")}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
                  This event only
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => handleDelete("thisAndFuture")}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
                  This and following events
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => handleDelete("all")}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
                  All events in series
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => setShowDeleteModeSelector(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
