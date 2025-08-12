import { test, expect } from '@playwright/test';

const links = "http://move-admin-dev-team.s3-website-ap-southeast-1.amazonaws.com/"
const logins={
  "user": {
    "true": "Evtaxi",
    "false": "taxiEv"
  },
  "pass": {
    "true": "Taxi1234!",
    "false": "taxi112233"
  }
}

test.describe('Login page tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(links);
  });

  test('should have correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Move Innovation/);
  });

  test('login with invalid credentials', async ({ page }) => {
    await page.getByLabel('ชื่อผู้ใช้').click();
    await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill(logins.user.false);
    await page.getByLabel('รหัสผ่าน').click();
    await page.getByPlaceholder('******').fill(logins.pass.false);

    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(page.getByText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    try {
      // Fill login form
      await page.getByLabel('ชื่อผู้ใช้').click();
      await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill(logins.user.true);
      await page.getByLabel('รหัสผ่าน').click();
      await page.getByPlaceholder('******').fill(logins.pass.true);

      // Submit and wait for navigation with timeout
      await Promise.all([
        page.waitForNavigation({ timeout: 30000 }),
        page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
      ]);

      // Verify successful login
      await expect(page).toHaveTitle(/Move Innovation/);
      await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'รายงาน' })).toBeVisible();
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  });
});


