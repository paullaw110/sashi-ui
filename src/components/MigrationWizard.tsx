"use client";

import { useState, useEffect } from "react";
import { Organization, Project } from "@/lib/db/schema";

interface ProjectAssignment {
  projectId: string;
  organizationId: string | null;
}

interface MigrationWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function MigrationWizard({ onComplete, onCancel }: MigrationWizardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, orgsRes] = await Promise.all([
        fetch("/api/tasks"), // This will get projects through tasks
        fetch("/api/organizations"),
      ]);

      const projectsData = await projectsRes.json();
      const orgsData = await orgsRes.json();

      // Get unique projects from tasks
      const uniqueProjects = new Map<string, Project>();
      projectsData.tasks?.forEach((task: any) => {
        if (task.project && !task.project.organizationId) {
          uniqueProjects.set(task.project.id, task.project);
        }
      });

      const unassignedProjects = Array.from(uniqueProjects.values());
      setProjects(unassignedProjects);
      setOrganizations(orgsData.organizations || []);

      // Initialize assignments
      setAssignments(unassignedProjects.map(project => ({
        projectId: project.id,
        organizationId: null,
      })));
    } catch (error) {
      console.error("Error fetching data:", error);
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
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations([...organizations, data.organization]);
        setNewOrgName("");
        setIsCreatingOrg(false);
      }
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  };

  const updateAssignment = (projectId: string, organizationId: string | null) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.projectId === projectId 
          ? { ...assignment, organizationId }
          : assignment
      )
    );
  };

  const runMigration = async () => {
    setIsMigrating(true);

    try {
      const response = await fetch("/api/organizations/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignments: assignments,
        }),
      });

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error("Error during migration:", error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold mb-4">Migration Complete</h3>
          <p className="text-sm text-gray-600 mb-4">
            All projects are already assigned to organizations.
          </p>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Assign Projects to Organizations</h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Assign your existing projects to organizations. Projects without an organization will be shown as "Unassigned".
        </p>

        {/* Create new organization section */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Create New Organization:</span>
            <button
              onClick={() => setIsCreatingOrg(!isCreatingOrg)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {isCreatingOrg ? "Cancel" : "+ New"}
            </button>
          </div>
          
          {isCreatingOrg && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Organization name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              />
              <button
                onClick={createOrganization}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          )}
        </div>

        {/* Project assignments */}
        <div className="space-y-3 mb-6">
          {projects.map((project) => {
            const assignment = assignments.find(a => a.projectId === project.id);
            
            return (
              <div key={project.id} className="flex items-center justify-between border border-gray-200 rounded p-3">
                <div>
                  <div className="font-medium text-sm">{project.name}</div>
                  {project.type && (
                    <div className="text-xs text-gray-500">Type: {project.type}</div>
                  )}
                </div>
                
                <select
                  value={assignment?.organizationId || ""}
                  onChange={(e) => updateAssignment(project.id, e.target.value || null)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 min-w-[150px]"
                >
                  <option value="">Unassigned</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            disabled={isMigrating}
          >
            Skip for Now
          </button>
          <button
            onClick={runMigration}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isMigrating}
          >
            {isMigrating ? "Migrating..." : "Assign Projects"}
          </button>
        </div>
      </div>
    </div>
  );
}