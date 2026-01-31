import { describe, it, expect } from 'vitest'
import { cn, generateId } from './utils'

describe('cn (className merger)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })
  
  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })
  
  it('dedupes tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })
  
  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })
  
  it('includes prefix when provided', () => {
    const id = generateId('task')
    expect(id.startsWith('task_')).toBe(true)
  })
  
  it('generates IDs without prefix', () => {
    const id = generateId()
    expect(id).toBeTruthy()
    expect(id.length).toBeGreaterThan(5)
  })
  
  it('generates alphanumeric IDs', () => {
    const id = generateId()
    expect(/^[a-z0-9_]+$/i.test(id)).toBe(true)
  })
})
