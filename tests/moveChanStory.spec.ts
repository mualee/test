import { test, expect } from '@playwright/test';
//using.json
import fs from 'fs';
import path from 'path';
const usingPath = path.join(__dirname, '../using.json');
interface UserData {
  id: number;
  FullName: string;
  cost: string;
  beforeChar: string;
  afterChar: string;

}
const data: UserData[] = [];

test('check customer', async ({ page }) => {
  test.setTimeout(7200000); // 2 hours timeout for processing all records

  // Set longer page timeout
  page.setDefaultTimeout(30000); // 30 seconds for page operations

  await page.goto('https://admin.moveinno.com/');
  // Expect a title "to contain" a substring.
  await page.locator('div').filter({ hasText: /^ชื่อผู้ใช้$/ }).click();
  // await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evmanager');
  await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evlaomanager');
  await page.getByLabel('รหัสผ่าน').click();
  // await page.getByPlaceholder('******').fill('1234');
  await page.getByPlaceholder('******').fill('HQj0[4Ii1Ghj8H2*');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

  await page.getByRole('link', { name: 'ประวัติการชาร์จ' }).click();

  await page.goto('https://admin.moveinno.com/move-ev/charging-history-management?page=1&startDate=2025-08-12&endDate=2025-08-12');
  await page.waitForLoadState('networkidle'); // Wait for initial page to load

let countRow = 0;
let countPage = 0;
let countPages = 1;
let id = 0;

while (countRow < 178) { // Start with smaller batch for testing
  try {
    // Check if page is still valid
    if (page.isClosed()) {
      console.error('Page has been closed, breaking loop');
      break;
    }

    const tables = (countRow + 1).toString();

    // Check if we need to go to next page
    if (countPage === 50) {
      countPages++
      await page.goto('https://admin.moveinno.com/move-ev/charging-history-management?page=' + countPages + '&startDate=2025-08-12&endDate=2025-08-12');
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle'); // Wait for page to load
      await page.getByLabel('Next page').click();

      countPage = 0; // Reset page counter (countpage - countpage = 0)
    }

    // Click on the cell - add better error handling
    try {
      await page.getByRole('cell', { name: tables, exact: true }).click();
      await page.waitForTimeout(500); // Small delay after click
    } catch (clickError) {
      console.error(`Failed to click on cell ${tables}:`, clickError);
      // Try to refresh the page and continue
      await page.reload();
      await page.waitForLoadState('networkidle');
      countRow++; // Skip this row and continue
      continue;
    }

    // Wait for the data to be available (more efficient than fixed timeout)
    try {
      await page.waitForSelector('#detail-full-name', { timeout: 10000 });
    } catch (selectorError) {
      console.error(`Failed to find detail elements for row ${countRow + 1}:`, selectorError);
      // Try to go back and continue with next row
      await page.getByRole('button', { name: 'ประวัติการชาร์จ' }).click();
      await page.waitForSelector('table', { timeout: 5000 });
      countRow++;
      countPage++;
      continue;
    }

    // Get values from the page elements with better error handling
    let fullName = '';
    let cost = '';
    let beforeChar = '0';
    let afterChar = '0';

    try {
      fullName = await page.locator('#detail-full-name').textContent() ?? '';
      cost = await page.locator('#detail-total-credit').textContent() ?? '';
      beforeChar = await page.locator('#detail-credit-before').textContent() ?? '0';
      afterChar = await page.locator('#detail-credit-after').textContent() ?? '0';
    } catch (dataError) {
      console.error(`Failed to extract data for row ${countRow + 1}:`, dataError);
      // Continue with empty data
    }

    if (Number(beforeChar) - Number(cost) !== Number(afterChar)) {
    data.push({
        id: countRow + 1, // Use countRow + 1 for proper incremental ID
        FullName: fullName,
        cost: cost,
        beforeChar: beforeChar,
        afterChar: afterChar,
      });

    }





    countPage++;
    countRow++;

    // Log progress every 10 rows
    if (countRow % 10 === 0) {
      console.log(`Progress: Processed ${countRow} rows, Found ${data.length} mismatches`);

      // Save intermediate results every 50 rows to prevent data loss
      if (countRow % 50 === 0) {
        try {
          const intermediateFilePath = path.join(__dirname, `using_progress_${countRow}.json`);
          fs.writeFileSync(intermediateFilePath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`Intermediate save: ${data.length} records saved to using_progress_${countRow}.json`);
        } catch (error) {
          console.error('Error saving intermediate results:', error);
        }
      }
    }

    // Navigate back to charging history efficiently with better error handling
    try {
      await page.getByRole('button', { name: 'ประวัติการชาร์จ' }).click();
      await page.waitForSelector('table', { timeout: 10000 }); // Wait for table to load
    } catch (navigationError) {
      console.error(`Failed to navigate back for row ${countRow + 1}:`, navigationError);
      // Try to reload the main page
      await page.goto('https://admin.moveinno.com/move-ev/charging-history-management?page=' + countPages + '&startDate=2025-08-12&endDate=2025-08-12');
      await page.waitForLoadState('networkidle');
      // Don't increment counters, retry the same row
      continue;
    }


  } catch (error) {
    console.error(`Error processing row ${countRow + 1}:`, error);
    countRow++; // Continue to next row even if current fails
  }

}

// Save data to using.json
try {
  const filePath = path.join(__dirname, 'using.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${data.length} mismatched records to using.json`);
  console.log('Data saved:', data);
} catch (error) {
  console.error('Error saving to using.json:', error);
}
});
