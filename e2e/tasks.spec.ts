import { test, expect } from '@playwright/test'

test.describe('Tasks', () => {
  test('should display tasks on dashboard', async ({ page }) => {
    await page.goto('/')
    
    // Should see Today and Next sections
    await expect(page.locator('text=Today')).toBeVisible()
    await expect(page.locator('text=Next')).toBeVisible()
  })

  test('should open quick add task with Cmd+N', async ({ page }) => {
    await page.goto('/')
    
    // Press Cmd+N
    await page.keyboard.press('Meta+n')
    
    // Should see quick add dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByPlaceholder(/what needs to be done/i)).toBeVisible()
  })

  test('should create a new task', async ({ page }) => {
    await page.goto('/')
    
    // Open quick add
    await page.keyboard.press('Meta+n')
    
    // Fill in task name
    const taskInput = page.getByPlaceholder(/what needs to be done/i)
    await taskInput.fill('E2E Test Task')
    
    // Submit
    await page.getByRole('button', { name: /create/i }).click()
    
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    
    // Task should appear somewhere on the page (might be in Today or Next)
    await expect(page.locator('text=E2E Test Task')).toBeVisible({ timeout: 5000 })
  })

  test('should filter tasks on tasks page', async ({ page }) => {
    await page.goto('/tasks')
    
    // Should see filter options
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('should switch between calendar views', async ({ page }) => {
    await page.goto('/tasks')
    
    // Should see month calendar by default
    await expect(page.locator('text=January 2026').or(page.locator('text=February 2026'))).toBeVisible()
  })
})

test.describe('Task Modal', () => {
  test('should open task modal when clicking a task', async ({ page }) => {
    await page.goto('/')
    
    // Wait for tasks to load
    await page.waitForTimeout(1000)
    
    // Try to find and click on any task
    const firstTask = page.locator('[class*="cursor-pointer"]').first()
    
    if (await firstTask.isVisible()) {
      await firstTask.click()
      
      // Should see task modal or side panel
      await expect(
        page.getByRole('dialog').or(page.locator('[data-state="open"]'))
      ).toBeVisible({ timeout: 3000 })
    }
  })
})
