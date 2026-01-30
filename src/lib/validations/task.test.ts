import { describe, it, expect } from 'vitest'
import { taskFormSchema, PRIORITIES, STATUSES } from './task'

describe('taskFormSchema', () => {
  it('validates a complete valid task', () => {
    const result = taskFormSchema.safeParse({
      name: 'Test task',
      organizationId: 'org-123',
      projectId: 'proj-123',
      priority: 'high',
      status: 'not_started',
      dueDate: '2026-02-01',
      dueTime: '14:00',
      description: 'Test description',
    })
    expect(result.success).toBe(true)
  })

  it('validates a minimal valid task', () => {
    const result = taskFormSchema.safeParse({
      name: 'Minimal task',
      organizationId: null,
      projectId: null,
      priority: null,
      status: 'not_started',
      dueDate: null,
      dueTime: null,
      description: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = taskFormSchema.safeParse({
      name: '',
      organizationId: null,
      projectId: null,
      priority: null,
      status: 'not_started',
      dueDate: null,
      dueTime: null,
      description: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('rejects name exceeding max length', () => {
    const result = taskFormSchema.safeParse({
      name: 'x'.repeat(501),
      organizationId: null,
      projectId: null,
      priority: null,
      status: 'not_started',
      dueDate: null,
      dueTime: null,
      description: null,
    })
    expect(result.success).toBe(false)
  })

  it('validates all priority values', () => {
    PRIORITIES.forEach(({ value }) => {
      const result = taskFormSchema.safeParse({
        name: 'Test',
        organizationId: null,
        projectId: null,
        priority: value,
        status: 'not_started',
        dueDate: null,
        dueTime: null,
        description: null,
      })
      expect(result.success).toBe(true)
    })
  })

  it('rejects invalid priority', () => {
    const result = taskFormSchema.safeParse({
      name: 'Test',
      organizationId: null,
      projectId: null,
      priority: 'invalid-priority',
      status: 'not_started',
      dueDate: null,
      dueTime: null,
      description: null,
    })
    expect(result.success).toBe(false)
  })

  it('validates all status values', () => {
    STATUSES.forEach(({ value }) => {
      const result = taskFormSchema.safeParse({
        name: 'Test',
        organizationId: null,
        projectId: null,
        priority: null,
        status: value,
        dueDate: null,
        dueTime: null,
        description: null,
      })
      expect(result.success).toBe(true)
    })
  })

  it('rejects invalid status', () => {
    const result = taskFormSchema.safeParse({
      name: 'Test',
      organizationId: null,
      projectId: null,
      priority: null,
      status: 'invalid-status',
      dueDate: null,
      dueTime: null,
      description: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('PRIORITIES constant', () => {
  it('has expected priority options', () => {
    expect(PRIORITIES.map(p => p.value)).toEqual([
      'non-negotiable',
      'critical',
      'high',
      'medium',
      'low',
    ])
  })

  it('has labels for all priorities', () => {
    PRIORITIES.forEach(p => {
      expect(p.label).toBeTruthy()
    })
  })
})

describe('STATUSES constant', () => {
  it('has expected status options', () => {
    expect(STATUSES.map(s => s.value)).toEqual([
      'not_started',
      'in_progress',
      'waiting',
      'done',
    ])
  })

  it('has labels for all statuses', () => {
    STATUSES.forEach(s => {
      expect(s.label).toBeTruthy()
    })
  })
})
