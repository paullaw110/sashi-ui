"use client";

import { useState, useEffect } from "react";
import { Organization, NewOrganization } from "@/lib/db/schema";

interface OrganizationManagerProps {
  onOrganizationSelect?: (organization: Organization | null) => void;
  selectedOrganizationId?: string | null;
}

export default function OrganizationManager({ 
  onOrganizationSelect,
  selectedOrganizationId 
}: OrganizationManagerProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      const data = await response.json();
      setOrganizations(data.organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newOrgName,
          description: newOrgDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations([data.organization, ...organizations]);
        setNewOrgName("");
        setNewOrgDescription("");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  };

  const deleteOrganization = async (id: string) => {
    if (!confirm("Are you sure you want to delete this organization?")) return;

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
    return <div className="text-sm text-gray-600">Loading organizations...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Organizations</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          + Add Organization
        </button>
      </div>

      {isCreating && (
        <div className="space-y-2 p-3 border border-gray-200 rounded-md">
          <input
            type="text"
            placeholder="Organization name"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newOrgDescription}
            onChange={(e) => setNewOrgDescription(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          />
          <div className="flex gap-2">
            <button
              onClick={createOrganization}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewOrgName("");
                setNewOrgDescription("");
              }}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onOrganizationSelect?.(null)}
          className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-50 ${
            !selectedOrganizationId ? "bg-gray-100 font-medium" : ""
          }`}
        >
          All Organizations
        </button>
        
        {organizations.map((org) => (
          <div
            key={org.id}
            className={`flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50 ${
              selectedOrganizationId === org.id ? "bg-gray-100" : ""
            }`}
          >
            <button
              onClick={() => onOrganizationSelect?.(org)}
              className={`text-xs flex-1 text-left ${
                selectedOrganizationId === org.id ? "font-medium" : ""
              }`}
            >
              {org.name}
            </button>
            <button
              onClick={() => deleteOrganization(org.id)}
              className="text-xs text-gray-400 hover:text-red-600 ml-2"
            >
              ×
            </button>
          </div>
        ))}

        {organizations.length === 0 && (
          <div className="text-xs text-gray-500 px-2 py-1">
            No organizations yet
          </div>
        )}
      </div>
    </div>
  );
}