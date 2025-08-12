import { test, expect } from '@playwright/test';
//notSame.json
import fs from 'fs';
import path from 'path';
const notSamePath = path.join(__dirname, '../notSame.json');
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
  //to check if the id="InWallet" + id="Used" > id="TopUp" then data[0].fullName = id="FullName", data[0].phone = id="Phone", data[0].topUp = id="TopUp", data[0].used = id="Used", data[0].inWallet = id="InWallet" save to notSame.json
  //countpage=countpage + 1;
// Main loop
let countRow = 0;
let countPage = 0;
  let countPages = 1;
  let id = 0;

while (countRow < 1185) { // Start with smaller batch for testing
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

    // Wait for the data to be available (more efficient than fixed timeout)
    await page.waitForSelector('#FullName', { timeout: 5000 });

    // Get values from the page elements
    const fullName = await page.locator('#FullName').textContent() ?? '';
    const phone = await page.locator('#Phone').textContent() ?? '';
    const topUpText = await page.locator('#TopUp').textContent() ?? '0';
    const usedText = await page.locator('#Used').textContent() ?? '0';
    const inWalletText = await page.locator('#InWallet').textContent() ?? '0';

    // Convert string values to numbers
    const topUp = parseInt(topUpText.replace(/,/g, ''), 10);
    const used = parseInt(usedText.replace(/,/g, ''), 10);
    const inWallet =parseInt(inWalletText.replace(/,/g, ''), 10);
// parseInt(inWalletText);
    // Check if InWallet + Used > TopUp
    if (inWallet + used > topUp) {

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
          const intermediateFilePath = path.join(__dirname, `notSame_progress_${countRow}.json`);
          fs.writeFileSync(intermediateFilePath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`Intermediate save: ${data.length} records saved to notSame_progress_${countRow}.json`);
        } catch (error) {
          console.error('Error saving intermediate results:', error);
        }
      }
    }

    // Navigate back to user management efficiently
    await page.getByRole('button', { name: 'จัดการลูกค้า' }).click();
    await page.waitForSelector('table', { timeout: 5000 }); // Wait for table to load


  } catch (error) {
    console.error(`Error processing row ${countRow + 1}:`, error);
    countRow++; // Continue to next row even if current fails
  }

}

// Save data to notSame.json
try {
  const filePath = path.join(__dirname, 'notSame.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${data.length} mismatched records to notSame.json`);
  console.log('Data saved:', data);
} catch (error) {
  console.error('Error saving to notSame.json:', error);
}
});
