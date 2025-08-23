import { test, expect } from '@playwright/test'

test.describe('QR Scan Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate to scan page', async ({ page }) => {
    await page.click('text=Start Scanning')
    await expect(page).toHaveURL('/scan')
    await expect(page.locator('h1')).toContainText('Scan QR Code')
  })

  test('should show camera permission request', async ({ page }) => {
    await page.goto('/scan')
    
    // Mock camera permission denial
    await page.context().grantPermissions([])
    
    await page.click('text=Start QR Scanner')
    await expect(page.locator('text=Camera Access Required')).toBeVisible()
  })

  test('should handle successful scan', async ({ page }) => {
    await page.goto('/scan')
    
    // Mock camera permission
    await page.context().grantPermissions(['camera'])
    
    // Mock successful QR scan
    await page.evaluate(() => {
      // Simulate QR scanner finding a credential
      const mockCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'test-credential',
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2023-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:subject' },
        proof: {
          type: 'Ed25519Signature2020',
          created: '2023-01-01T00:00:00Z',
          verificationMethod: 'did:example:issuer#key-1',
          proofPurpose: 'assertionMethod',
          proofValue: 'z3MvGX7...'
        }
      }
      
      // Trigger credential scanned event
      window.dispatchEvent(new CustomEvent('credential-scanned', {
        detail: mockCredential
      }))
    })
    
    // Should show verification result
    await expect(page.locator('text=Verification')).toBeVisible()
  })

  test('should export verification result', async ({ page }) => {
    await page.goto('/scan')
    
    // Simulate having a verification result
    await page.evaluate(() => {
      localStorage.setItem('test-result', JSON.stringify({
        id: 'test-result-id',
        status: 'valid',
        timestamp: new Date().toISOString()
      }))
    })
    
    // Mock download
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Export')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toMatch(/vc-verification-.*\.json/)
  })
})