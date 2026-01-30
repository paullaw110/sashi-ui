import { describe, it, expect } from 'vitest'
import { organizationFormSchema } from './organization'

describe('organizationFormSchema', () => {
  it('validates a complete valid organization', () => {
    const result = organizationFormSchema.safeParse({
      name: 'Acme Corp',
      description: 'A test organization',
    })
    expect(result.success).toBe(true)
  })

  it('validates organization with null description', () => {
    const result = organizationFormSchema.safeParse({
      name: 'Acme Corp',
      description: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = organizationFormSchema.safeParse({
      name: '',
      description: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
      expect(result.error.issues[0].message).toBe('Organization name is required')
    }
  })

  it('rejects name exceeding max length', () => {
    const result = organizationFormSchema.safeParse({
      name: 'x'.repeat(101),
      description: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is too long')
    }
  })

  it('accepts name at max length', () => {
    const result = organizationFormSchema.safeParse({
      name: 'x'.repeat(100),
      description: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects description exceeding max length', () => {
    const result = organizationFormSchema.safeParse({
      name: 'Test Org',
      description: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description is too long')
    }
  })

  it('accepts description at max length', () => {
    const result = organizationFormSchema.safeParse({
      name: 'Test Org',
      description: 'x'.repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty string description', () => {
    const result = organizationFormSchema.safeParse({
      name: 'Test Org',
      description: '',
    })
    expect(result.success).toBe(true)
  })
})
