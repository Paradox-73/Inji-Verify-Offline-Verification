import { test, expect } from '@playwright/test'

test.describe('History Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history')
  })

  test('should display empty state when no results', async ({ page }) => {
    await expect(page.locator('text=No Results Found')).toBeVisible()
    await expect(page.locator('text=You haven\'t verified any credentials yet')).toBeVisible()
  })

  test('should display verification results', async ({ page }) => {
    // Mock verification results in IndexedDB
    await page.evaluate(() => {
      const mockResults = [
        {
          id: 'result-1',
          status: 'valid',
          timestamp: new Date('2023-01-01'),
          metadata: {
            issuer: 'Test Issuer',
            type: 'TestCredential',
            issuanceDate: '2023-01-01T00:00:00Z'
          },
          synced: true
        },
        {
          id: 'result-2',
          status: 'invalid',
          timestamp: new Date('2023-01-02'),
          metadata: {
            issuer: 'Another Issuer',
            type: 'AnotherCredential',
            issuanceDate: '2023-01-02T00:00:00Z'
          },
          synced: false
        }
      ]
      
      localStorage.setItem('mock-results', JSON.stringify(mockResults))
    })
    
    await page.reload()
    
    await expect(page.locator('text=Test Issuer')).toBeVisible()
    await expect(page.locator('text=Another Issuer')).toBeVisible()
  })

  test('should filter results by status', async ({ page }) => {
    // Add mock results first
    await page.evaluate(() => {
      const mockResults = [
        { id: '1', status: 'valid', metadata: { issuer: 'Valid Issuer' } },
        { id: '2', status: 'invalid', metadata: { issuer: 'Invalid Issuer' } }
      ]
      localStorage.setItem('mock-results', JSON.stringify(mockResults))
    })
    
    await page.reload()
    
    // Filter by valid
    await page.click('button:has-text("Valid")')
    await expect(page.locator('text=Valid Issuer')).toBeVisible()
    await expect(page.locator('text=Invalid Issuer')).not.toBeVisible()
    
    // Filter by invalid
    await page.click('button:has-text("Invalid")')
    await expect(page.locator('text=Invalid Issuer')).toBeVisible()
    await expect(page.locator('text=Valid Issuer')).not.toBeVisible()
  })

  test('should search results', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Test Issuer')
    
    // Should filter results based on search
    await expect(page.locator('text=Test Issuer')).toBeVisible()
  })

  test('should export all results', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Export All')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toMatch(/vc-verification-history-.*\.json/)
  })
})