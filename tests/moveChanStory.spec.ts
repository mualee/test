import { test, expect } from '@playwright/test';
//using.json
import fs from 'fs';
import path from 'path';
const usingPath = path.join(__dirname, '../using.json');
interface UserData {
  id: number;
  name: string;
  creditBefore: number;
  totalCredit: number;
  creditAfter: number;
}
const data: UserData[] = [];

test('check customer', async ({ page }) => {
  test.setTimeout(7200000); // 2 hours timeout for processing all records

  // Set optimized page timeout
  page.setDefaultTimeout(15000); // Reduced from 30 seconds

  // Optimize page loading
  await page.goto('https://admin.moveinno.com/', { waitUntil: 'domcontentloaded' });
  // Expect a title "to contain" a substring.
  await page.locator('div').filter({ hasText: /^ชื่อผู้ใช้$/ }).click();
  // await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evmanager');
  await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evlaomanager');
  await page.getByLabel('รหัสผ่าน').click();
  // await page.getByPlaceholder('******').fill('1234');
  await page.getByPlaceholder('******').fill('HQj0[4Ii1Ghj8H2*');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

  await page.getByRole('link', { name: 'ประวัติการชาร์จ' }).click();

  // Try a broader date range to find data - using a month range
  await page.goto('https://admin.moveinno.com/move-ev/charging-history-management?page=1&startDate=2025-08-12&endDate=2025-08-12', { waitUntil: 'domcontentloaded' });

  let countRow = 0;
  let countPage = 0;
  let countPages = 1;
  let id = 0;
  // Wait for the total items element and get its value
  const itemsLocator = page.locator('//*[@id="root"]/div/main/div[2]/div/div/div/div[3]/div[1]/div[1]/p[2]');
  await itemsLocator.waitFor({ timeout: 15000 });
  const itemsText = await itemsLocator.textContent() ?? '0';
  console.log('Raw items text:', itemsText);
  let items = Number(itemsText.replace(/[^0-9]/g, ''));
  console.log('Total items from selector:', items);

  // If no items found, try to count table rows as fallback
  if (items === 0) {
    console.log('No items found with primary selector, trying table row count...');

    // Wait for table to load and count data rows (excluding header)
    await page.waitForSelector('tbody tr', { timeout: 5000 }).catch(() => {});
    const tableRows = await page.locator('tbody tr').count();
    console.log('Table rows found:', tableRows);

    if (tableRows > 0) {
      items = tableRows;
      console.log('Using table row count as items:', items);
    } else {
      console.log('No data rows found. This might be because:');
      console.log('1. The selected date has no charging history');
      console.log('2. The page is still loading');
      console.log('3. The user has no permission to view this data');

      // Let's try a different date range or check current date
      console.log('Current URL:', page.url());
    }
  }while (countRow < 279) { // Start with smaller batch for testing
  try {
    const tables = (countRow + 1).toString();

    // Check if we need to go to next page
    if (countPage === 50) {
      countPages++;
      await page.goto(`https://admin.moveinno.com/move-ev/charging-history-management?page=${countPages}&startDate=2025-08-12&endDate=2025-08-12`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500); // Reduced timeout
      countPage = 0; // Reset page counter
    }

    // Check if the cell exists before clicking to avoid timeouts
    const cellLocator = page.getByRole('cell', { name: tables, exact: true });
    if (await cellLocator.count() === 0) {
      console.log(`Row ${countRow + 1}: Cell not found, skipping`);
      countPage++;
      countRow++;
      continue;
    }

    // Click on the cell
    await cellLocator.click();
    await page.waitForTimeout(200); // Reduced timeout

    // Wait for the data to be available with optimized timeout
    try {
      await page.waitForSelector('#detail-full-name', { timeout: 10000 });
    } catch (error) {
      console.log(`Row ${countRow + 1}: Detail element not found, skipping...`);
      countPage++;
      countRow++;

      // Try to navigate back before continuing
      try {
        await page.getByRole('button', { name: 'ประวัติการชาร์จ' }).click();
        await page.waitForSelector('table', { timeout: 5000 });
      } catch (navError) {
        // Reload page if navigation fails
        await page.goto(`https://admin.moveinno.com/move-ev/charging-history-management?page=${countPages}&startDate=2025-08-12&endDate=2025-08-12`);
        await page.waitForLoadState('networkidle');
      }
      continue;
    }

    // Get all required data in parallel for better performance
    const [fullName, credit_before, credit_after, total_credit] = await Promise.all([
      page.locator('#detail-full-name').textContent().catch(() => ''),
      page.locator('#detail-credit-before').textContent().catch(() => '0'),
      page.locator('#detail-credit-after').textContent().catch(() => '0'),
      page.locator('#detail-total-credit').textContent().catch(() => '0')
    ]);

    // Convert string values to numbers with better parsing
    const before = parseInt((credit_before || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const after = parseInt((credit_after || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const totalCredit = parseInt((total_credit || '0').replace(/[^0-9]/g, ''), 10) || 0;
// parseInt(inWalletText);
    // Check if calculation is correct
    // if (before - totalCredit !== after) {
    //   data.push({
    //     id: id++,
    //     name: fullName || 'Unknown',
    //     creditBefore: before,
    //     totalCredit: totalCredit,
    //     creditAfter: after
    //   });

    //   console.log(`Mismatch found at row ${countRow + 1}: before(${before}) - used(${totalCredit}) !== after(${after})`);
    // }

      data.push({
        id: id++,
        name: fullName || 'Unknown',
        creditBefore: before,
        totalCredit: totalCredit,
        creditAfter: after
      });

      console.log(`Mismatch found at row ${countRow + 1}: before(${before}) - used(${totalCredit}) `);


    countPage++;
    countRow++;

    // Log progress every 10 rows
    if (countRow % 10 === 0) {
      console.log(`Progress: Processed ${countRow} rows, Found ${data.length} mismatches`);

      // Save intermediate results every 50 rows to prevent data loss
      if (countRow % 50 === 0) {
        try {
          const intermediateFilePath = path.join(__dirname, `used_progress_${countRow}.json`);
          fs.writeFileSync(intermediateFilePath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`Intermediate save: ${data.length} records saved to used_progress_${countRow}.json`);
        } catch (error) {
          console.error('Error saving intermediate results:', error);
        }
      }
    }

    // Navigate back efficiently
    await page.getByRole('button', { name: 'ประวัติการชาร์จ' }).click();
    await page.waitForSelector('table', { timeout: 5000 }); // Reduced timeout

    // Verify we're back on the correct page (optional check, can be removed for speed)
    const currentUrl = page.url();
    if (!currentUrl.includes('charging-history-management')) {
      console.log(`Row ${countRow + 1}: Not on charging history page, navigating back...`);
      await page.goto(`https://admin.moveinno.com/move-ev/charging-history-management?page=${countPages}&startDate=2025-08-12&endDate=2025-08-12`);
      await page.waitForLoadState('networkidle');
    }


  } catch (error) {
    console.error(`Error processing row ${countRow + 1}:`, error.message);

    // Try to navigate back efficiently
    try {
      await page.getByRole('button', { name: 'ประวัติการชาร์จ' }).click();
      await page.waitForTimeout(500);
    } catch (navError) {
      console.error(`Error navigating back from row ${countRow + 1}:`, navError.message);
      // If navigation fails, try to reload the current page
      await page.goto(`https://admin.moveinno.com/move-ev/charging-history-management?page=${countPages}&startDate=2025-07-01&endDate=2025-08-13`);
      await page.waitForLoadState('networkidle');
    }

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
