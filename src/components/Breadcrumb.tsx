"use client";

import { Organization, Project } from "@/lib/db/schema";

interface BreadcrumbProps {
  organization?: Organization | null;
  project?: Project | null;
  onOrganizationClick?: (org: Organization) => void;
  onProjectClick?: (project: Project) => void;
  className?: string;
}

export default function Breadcrumb({ 
  organization, 
  project, 
  onOrganizationClick,
  onProjectClick,
  className = ""
}: BreadcrumbProps) {
  if (!organization && !project) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        Unassigned
      </div>
    );
  }

  const orgName = organization?.name || "Unassigned";
  const projectName = project?.name;

  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <span
        onClick={() => organization && onOrganizationClick?.(organization)}
        className={organization && onOrganizationClick ? "cursor-pointer hover:text-gray-800" : ""}
      >
        {orgName}
      </span>
      
      {projectName && (
        <>
          <span className="mx-1 text-gray-400">/</span>
          <span
            onClick={() => project && onProjectClick?.(project)}
            className={project && onProjectClick ? "cursor-pointer hover:text-gray-800" : ""}
          >
            {projectName}
          </span>
        </>
      )}
    </div>
  );
}