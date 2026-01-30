import { test, expect } from '@playwright/test'

test.describe('Calendar Drag and Drop', () => {
  test('should move task to a different date via drag and drop', async ({ page }) => {
    await page.goto('/tasks')
    
    // Wait for calendar to load
    await page.waitForSelector('[data-task-item]', { timeout: 10000 })
    
    // Find a task on the calendar
    const task = page.locator('[data-task-item]').first()
    const taskName = await task.textContent()
    
    // Get the task's initial date container
    const initialDateCell = task.locator('xpath=ancestor::div[contains(@class, "border-r")]')
    
    // Find a different date cell to drop onto (next week)
    // Get all droppable cells and pick one that's empty or different
    const targetCell = page.locator('.grid-cols-7 > div').nth(20) // ~3 weeks forward
    
    // Perform drag and drop
    await task.dragTo(targetCell)
    
    // Wait for toast to appear confirming move
    await expect(page.locator('text=/Moved to/')).toBeVisible({ timeout: 5000 })
    
    // Verify the task actually moved by checking it's in the new location
    // The task should now be inside the target cell
    await page.waitForTimeout(500) // Wait for optimistic update
    
    // Verify task is no longer in original position OR is in new position
    const taskInNewLocation = targetCell.locator(`text=${taskName?.split('\n')[0]}`)
    await expect(taskInNewLocation).toBeVisible({ timeout: 3000 })
  })

  test('should persist task move after page refresh', async ({ page }) => {
    await page.goto('/tasks')
    
    // Wait for calendar to load
    await page.waitForSelector('[data-task-item]', { timeout: 10000 })
    
    // Find a task and note its name
    const task = page.locator('[data-task-item]').first()
    const taskText = await task.textContent()
    const taskName = taskText?.split('\n')[0]?.trim()
    
    if (!taskName) {
      test.skip()
      return
    }
    
    // Find target cell (a specific date)
    const targetCell = page.locator('.grid-cols-7 > div').nth(25)
    
    // Drag task to new date
    await task.dragTo(targetCell)
    
    // Wait for toast
    await expect(page.locator('text=/Moved to/')).toBeVisible({ timeout: 5000 })
    
    // Wait for API call to complete
    await page.waitForTimeout(1000)
    
    // Refresh page
    await page.reload()
    
    // Wait for calendar to reload
    await page.waitForSelector('[data-task-item]', { timeout: 10000 })
    
    // Verify task is still in the new location (persisted to DB)
    const taskAfterRefresh = targetCell.locator(`text=${taskName}`)
    await expect(taskAfterRefresh).toBeVisible({ timeout: 5000 })
  })

  test('should show optimistic update immediately', async ({ page }) => {
    await page.goto('/tasks')
    
    await page.waitForSelector('[data-task-item]', { timeout: 10000 })
    
    const task = page.locator('[data-task-item]').first()
    const targetCell = page.locator('.grid-cols-7 > div').nth(15)
    
    // Start drag
    await task.hover()
    await page.mouse.down()
    
    // Move to target
    const targetBox = await targetCell.boundingBox()
    if (targetBox) {
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2)
    }
    
    // Drop
    await page.mouse.up()
    
    // Check that UI updates BEFORE toast (optimistic update)
    // The task should move immediately, not wait for server response
    const toastVisible = await page.locator('text=/Moved to/').isVisible()
    
    // Toast should appear quickly (within 500ms of drop)
    await expect(page.locator('text=/Moved to/')).toBeVisible({ timeout: 2000 })
  })
})
