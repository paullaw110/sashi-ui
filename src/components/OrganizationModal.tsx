"use client";

import { useState, useEffect } from "react";
import { X, Building2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Organization } from "@/lib/db/schema";

interface OrganizationModalProps {
  organization?: Organization | null;
  isOpen: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onSave: (orgData: { id?: string; name: string; description?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function OrganizationModal({
  organization,
  isOpen,
  isCreating = false,
  onClose,
  onSave,
  onDelete,
}: OrganizationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setDescription(organization.description || "");
      setIsEditing(false);
    } else if (isCreating) {
      setName("");
      setDescription("");
      setIsEditing(true);
    }
  }, [organization, isCreating]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      await onSave({
        id: organization?.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save organization:", error);
      alert("Failed to save organization. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!organization?.id || !onDelete) return;
    if (!confirm("Delete this organization? This action cannot be undone.")) return;
    
    try {
      await onDelete(organization.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete organization:", error);
      alert("Failed to delete organization. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#737373]" />
            <h2 className="font-display text-lg text-[#f5f5f5]">
              {isCreating ? "New Organization" : isEditing ? "Edit Organization" : "Organization Details"}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {organization && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-[#737373] hover:text-[#a3a3a3] px-3 py-1.5 rounded transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#737373] hover:text-[#a3a3a3] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Organization Name */}
          <div>
            <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">
              Organization Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                placeholder="Enter organization name..."
                autoFocus
              />
            ) : (
              <p className="text-sm text-[#f5f5f5] font-medium">{name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors resize-none"
                placeholder="Optional description..."
                rows={3}
              />
            ) : (
              <p className="text-xs text-[#a3a3a3]">
                {description || "No description"}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a1a] bg-[#0a0a0a]">
            <div>
              {organization && onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isCreating) {
                    onClose();
                  } else {
                    setIsEditing(false);
                    // Reset to original values
                    if (organization) {
                      setName(organization.name);
                      setDescription(organization.description || "");
                    }
                  }
                }}
                className="text-xs text-[#737373] hover:text-[#a3a3a3] px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex items-center gap-2 text-xs text-[#0c0c0c] bg-[#f5f5f5] hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition-colors"
              >
                {saving ? "Saving..." : isCreating ? "Create" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}