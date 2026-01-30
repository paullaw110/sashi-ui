import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should load the dashboard', async ({ page }) => {
    await page.goto('/')
    
    // Should see the Sashi branding
    await expect(page.locator('text=Sashi')).toBeVisible()
    
    // Should see main navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Tasks')).toBeVisible()
  })

  test('should navigate to tasks page', async ({ page }) => {
    await page.goto('/')
    
    // Click on Tasks in the sidebar
    await page.click('text=Tasks')
    
    // Should be on tasks page
    await expect(page).toHaveURL('/tasks')
    
    // Should see the tasks view
    await expect(page.locator('text=Today')).toBeVisible()
  })

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Calendar')
    
    await expect(page).toHaveURL('/calendar')
  })

  test('should navigate to notes page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Notes')
    
    await expect(page).toHaveURL('/notes')
  })

  test('should navigate to leads page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Leads')
    
    await expect(page).toHaveURL('/leads')
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('should open command palette with Cmd+K', async ({ page }) => {
    await page.goto('/')
    
    // Press Cmd+K
    await page.keyboard.press('Meta+k')
    
    // Should see command palette dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByPlaceholder(/type a command/i)).toBeVisible()
  })

  test('should toggle sidebar with Cmd+B', async ({ page }) => {
    await page.goto('/')
    
    // Verify sidebar is visible initially
    const sidebar = page.locator('nav')
    await expect(sidebar).toBeVisible()
    
    // Press Cmd+B to collapse
    await page.keyboard.press('Meta+b')
    
    // Wait for transition
    await page.waitForTimeout(350)
  })
})
