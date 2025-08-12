import { test, expect } from '@playwright/test';
//used.json
import fs from 'fs';
import path from 'path';
const usedPath = path.join(__dirname, '../used.json');
interface UserData {
  id: number;
  FullName: string;
  Phone: string;
  TopUp: string;
  Used: string;
  InWallet: string;
}
const data: UserData[] = [];
test('has title', async ({ page }) => {
  // await page.goto('http://move-admin-dev-team.s3-website-ap-southeast-1.amazonaws.com/');
  await page.goto('https://admin.moveinno.com/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Move Innovation/);
});
test('can login', async ({ page }) => {
  await page.goto('https://admin.moveinno.com/');
  // Expect a title "to contain" a substring.
  await page.locator('div').filter({ hasText: /^ชื่อผู้ใช้$/ }).click();
  // await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evmanager');
  await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evlaomanager');
  await page.getByLabel('รหัสผ่าน').click();
  // await page.getByPlaceholder('******').fill('1234');
  await page.getByPlaceholder('******').fill('HQj0[4Ii1Ghj8H2*');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();});
test('check customer', async ({ page }) => {
  test.setTimeout(7200000); // 2 hours timeout for processing all 1185 records

  await page.goto('https://admin.moveinno.com/');
  // Expect a title "to contain" a substring.
  await page.locator('div').filter({ hasText: /^ชื่อผู้ใช้$/ }).click();
  // await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evmanager');
  await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evlaomanager');
  await page.getByLabel('รหัสผ่าน').click();
  // await page.getByPlaceholder('******').fill('1234');
  await page.getByPlaceholder('******').fill('HQj0[4Ii1Ghj8H2*');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

  await page.getByRole('link', { name: 'จัดการลูกค้า' }).click();

  await page.goto('https://admin.moveinno.com/move-ev/user-management?page=1');

  //loop until countRow===1400, countpage=0,countRow=0
  //tables=string.countRow+1
  //if countpage===40 { await page.getByLabel('Next page').click(); countpage=countpage -countpage;}
  //await page.getByRole('cell', { name: tables, exact: true }).click();
  //chack
  //to check if the id="InWallet" + id="Used" > id="TopUp" then data[0].fullName = id="FullName", data[0].phone = id="Phone", data[0].topUp = id="TopUp", data[0].used = id="Used", data[0].inWallet = id="InWallet" save to used.json
  //countpage=countpage + 1;
// Main loop
let countRow = 0;
let countPage = 0;
  let countPages = 1;
  let id = 0;

while (countRow < 1721) { // Start with smaller batch for testing
  try {
    const tables = (countRow + 1).toString();

    // Check if we need to go to next page
    if (countPage === 40) {
      countPages++
      await page.goto('https://admin.moveinno.com/move-ev/user-management?page=' + countPages);
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle'); // Wait for page to load
      countPage = 0; // Reset page counter (countpage - countpage = 0)
    }

    // Click on the cell
    await page.getByRole('cell', { name: tables, exact: true }).click();

    // Wait for the data to be available with longer timeout and better error handling
    try {
      await page.waitForSelector('#FullName', { timeout: 15000 });
    } catch (error) {
      console.log(`Row ${countRow + 1}: FullName element not found, trying alternative approach...`);

      // Try to wait a bit and check if we're on the right page
      await page.waitForTimeout(2000);

      // Check if we can find any customer detail elements
      const hasCustomerDetails = await page.locator('#FullName').count() > 0;
      if (!hasCustomerDetails) {
        console.log(`Row ${countRow + 1}: Skipping - customer details not available`);
        countPage++;
        countRow++;
        continue;
      }
    }

    // Get values from the page elements with fallback checks
    let fullName = '';
    let phone = '';
    let topUpText = '0';
    let usedText = '0';
    let inWalletText = '0';

    try {
      // Try to get all elements, but handle individual failures
      fullName = await page.locator('#FullName').textContent() ?? '';
      phone = await page.locator('#Phone').textContent() ?? '';
      topUpText = await page.locator('#TopUp').textContent() ?? '0';
      usedText = await page.locator('#Used').textContent() ?? '0';
      inWalletText = await page.locator('#InWallet').textContent() ?? '0';
    } catch (elementError) {
      console.log(`Row ${countRow + 1}: Error getting element values, using defaults`);
    }

    // Convert string values to numbers
    const topUp = parseInt(topUpText.replace(/,/g, ''), 10);
    const used = parseInt(usedText.replace(/,/g, ''), 10);
    const inWallet =parseInt(inWalletText.replace(/,/g, ''), 10);
// parseInt(inWalletText);
    // Check if InWallet + Used > TopUp
    if (used!==0) {

      data.push({
        id: id++,
        FullName: fullName,
        Phone: phone,
        TopUp: topUpText,
        Used: usedText,
       InWallet: inWalletText
      });

      console.log(`Mismatch found at row ${countRow + 1}: InWallet(${inWallet}) + Used(${used}) = ${inWallet + used} > TopUp(${topUp})`);
    }

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

    // Navigate back to user management efficiently
    await page.getByRole('button', { name: 'จัดการลูกค้า' }).click();
    await page.waitForSelector('table', { timeout: 10000 }); // Wait for table to load with longer timeout

    // Verify we're back on the user management page
    const currentUrl = page.url();
    if (!currentUrl.includes('user-management')) {
      console.log(`Row ${countRow + 1}: Not on user management page, navigating back...`);
      await page.goto(`https://admin.moveinno.com/move-ev/user-management?page=${countPages}`);
      await page.waitForLoadState('networkidle');
    }


  } catch (error) {
    console.error(`Error processing row ${countRow + 1}:`, error);

    // Try to navigate back to the user management page if we're lost
    try {
      await page.getByRole('button', { name: 'จัดการลูกค้า' }).click();
      await page.waitForTimeout(1000);
    } catch (navError) {
      console.error(`Error navigating back from row ${countRow + 1}:`, navError);
      // If navigation fails, try to reload the current page
      await page.goto(`https://admin.moveinno.com/move-ev/user-management?page=${countPages}`);
      await page.waitForLoadState('networkidle');
    }

    countRow++; // Continue to next row even if current fails
  }

}

// Save data to used.json
try {
  const filePath = path.join(__dirname, 'used.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${data.length} mismatched records to used.json`);
  console.log('Data saved:', data);
} catch (error) {
  console.error('Error saving to used.json:', error);
}
});
