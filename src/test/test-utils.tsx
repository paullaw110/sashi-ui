import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Add any providers here
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data factories
export function createMockTask(overrides = {}) {
  return {
    id: `task-${Date.now()}`,
    name: 'Test Task',
    projectId: null,
    organizationId: null,
    priority: 'medium',
    status: 'not_started',
    dueDate: null,
    dueTime: null,
    tags: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockOrganization(overrides = {}) {
  return {
    id: `org-${Date.now()}`,
    name: 'Test Organization',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockProject(overrides = {}) {
  return {
    id: `proj-${Date.now()}`,
    name: 'Test Project',
    organizationId: null,
    color: null,
    type: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockLead(overrides = {}) {
  return {
    id: `lead-${Date.now()}`,
    businessName: 'Test Business',
    industry: 'Technology',
    location: 'Los Angeles, CA',
    address: null,
    phone: null,
    email: null,
    websiteUrl: null,
    websiteScreenshot: null,
    googleRating: null,
    reviewCount: null,
    topReviews: null,
    pagespeedScore: null,
    mobileFriendly: null,
    hasSSL: null,
    techStack: null,
    qualificationScore: null,
    issuesDetected: null,
    status: 'new',
    notes: null,
    briefUrl: null,
    previewSiteUrl: null,
    outreachSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
