"use client";

import { useState, useEffect } from "react";
import { Organization } from "@/lib/db/schema";
import { Building2, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";

interface OrganizationManagerProps {
  onOrganizationSelect?: (organization: Organization | null) => void;
  selectedOrganizationId?: string | null;
  onCreateClick?: () => void;
  onEditClick?: (organization: Organization) => void;
  onRefresh?: number;
}

export default function OrganizationManager({ 
  onOrganizationSelect,
  selectedOrganizationId,
  onCreateClick,
  onEditClick,
  onRefresh
}: OrganizationManagerProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Refresh when trigger changes
  useEffect(() => {
    if (onRefresh !== undefined && onRefresh > 0) {
      fetchOrganizations();
    }
  }, [onRefresh]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrganization = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this organization? This will also remove all associated projects.")) return;

    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOrganizations(organizations.filter(org => org.id !== id));
        if (selectedOrganizationId === id && onOrganizationSelect) {
          onOrganizationSelect(null);
        }
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xs text-[#525252]">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-[#525252]" />
          <h3 className="text-sm font-medium text-[#f5f5f5]">Organizations</h3>
          <span className="text-xs text-[#404040]">({organizations.length})</span>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus size={14} />
          Add Organization
        </button>
      </div>

      {/* Organization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* All Organizations Card */}
        <button
          onClick={() => onOrganizationSelect?.(null)}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
            !selectedOrganizationId 
              ? "bg-[#1a1a1a] border-[#333] ring-1 ring-blue-500/30" 
              : "bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#222] hover:bg-[#111]"
          }`}
        >
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            !selectedOrganizationId ? "bg-blue-500/20" : "bg-[#1a1a1a]"
          }`}>
            <Building2 size={16} className={!selectedOrganizationId ? "text-blue-400" : "text-[#525252]"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${
              !selectedOrganizationId ? "text-[#f5f5f5]" : "text-[#a3a3a3]"
            }`}>
              All Organizations
            </div>
            <div className="text-[10px] text-[#525252]">
              View all tasks
            </div>
          </div>
          <ChevronRight size={14} className="text-[#333] shrink-0" />
        </button>

        {/* Organization Cards */}
        {organizations.map((org) => (
          <div
            key={org.id}
            onClick={() => onOrganizationSelect?.(org)}
            className={`group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              selectedOrganizationId === org.id 
                ? "bg-[#1a1a1a] border-[#333] ring-1 ring-blue-500/30" 
                : "bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#222] hover:bg-[#111]"
            }`}
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              selectedOrganizationId === org.id ? "bg-blue-500/20" : "bg-[#1a1a1a]"
            }`}>
              <Building2 size={16} className={selectedOrganizationId === org.id ? "text-blue-400" : "text-[#525252]"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${
                selectedOrganizationId === org.id ? "text-[#f5f5f5]" : "text-[#a3a3a3]"
              }`}>
                {org.name}
              </div>
              {org.description && (
                <div className="text-[10px] text-[#525252] truncate">
                  {org.description}
                </div>
              )}
            </div>
            
            {/* Action buttons - show on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick?.(org);
                }}
                className="p-1.5 rounded hover:bg-[#222] text-[#525252] hover:text-[#a3a3a3] transition-colors"
                title="Edit organization"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={(e) => deleteOrganization(e, org.id)}
                className="p-1.5 rounded hover:bg-red-500/10 text-[#525252] hover:text-red-400 transition-colors"
                title="Delete organization"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {organizations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Building2 size={32} className="text-[#333] mb-3" />
          <p className="text-sm text-[#525252] mb-1">No organizations yet</p>
          <p className="text-xs text-[#404040] mb-4">Create an organization to group your projects</p>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus size={14} />
            Create your first organization
          </button>
        </div>
      )}
    </div>
  );
}
