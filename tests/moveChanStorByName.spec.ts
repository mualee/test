import { test, expect } from '@playwright/test';
//using.json
import fs from 'fs';
import path from 'path';
const usingPath = path.join(__dirname, '../output/using.json');
const AllusedsIn26_08_2025 = path.join(__dirname, './output/AllusedsIn15_09_2025.json');
// import json from '../output/AllusedsIn26_08_2025.json';
const datas = AllusedsIn26_08_2025 && fs.existsSync(AllusedsIn26_08_2025) ? JSON.parse(fs.readFileSync(AllusedsIn26_08_2025, 'utf-8')) : [];

console.log('Looking for file at:', AllusedsIn26_08_2025);
console.log('File exists:', fs.existsSync(AllusedsIn26_08_2025));

// Only try to read the file if it exists
let json: UserData[] = [];
if (fs.existsSync(AllusedsIn26_08_2025)) {
  json = JSON.parse(fs.readFileSync(AllusedsIn26_08_2025, 'utf-8'));
  console.log('Using JSON data:', json);
} else {
  console.log('AllusedsIn26_08_2025.json file not found, using empty array');
}

interface UserData {
  id: number;
  name: string;
  creditBefore: number;
  totalCredit: number;
  creditAfter: number;
  state_at: string;
  end_at: string;
  out_end_at: string;
  errorCode: string;
}
const data: UserData[] = [];
const startDate = '2025-09-15';
const endDate = '2025-09-15';
const statusTH = ["กำลังชาร์จ", "ชาร์จเสร็จ"]
const statusEN = ["CHARGING", "COMPLETED"]
// day == getDate() only dd from startDate
const startDay = new Date(startDate).getDate();
const endDay = new Date(endDate).getDate();
// const errorCodeText = ''

test('check customer', async ({ page }) => {
  test.setTimeout(7200000); // 2 hours timeout for processing all records
  await page.goto('https://admin.moveinno.com/');
  // Expect a title "to contain" a substring.
  await page.locator('div').filter({ hasText: /^ชื่อผู้ใช้$/ }).click();
  // await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evmanager');
  await page.getByPlaceholder('ป้อนชื่อผู้ใช้').fill('Evlaomanager');
  await page.getByLabel('รหัสผ่าน').click();
  // await page.getByPlaceholder('******').fill('1234');
  await page.getByPlaceholder('******').fill('HQj0[4Ii1Ghj8H2*');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

await page.getByRole('link', { name: 'จัดการลูกค้า' }).first().click();  // Use a broader date range that's more likely to have data
  await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
let countRow = 0;
  let countPage = 0;
  let countPages = 1;
  let id = 0;
  //loop by array json
  for (const user of json) {
    try {
      console.log(`Processing user: ${user.name}`);

      // Clear search field and search for user
      await page.getByPlaceholder('ค้นหาด้วยชื่อ และ นามสกุล').clear();
      await page.getByPlaceholder('ค้นหาด้วยชื่อ และ นามสกุล').fill(user.name);
      await page.waitForTimeout(1000); // Wait for search results

      // Click on the user with exact match
      await page.getByRole('cell', { name: user.name, exact: true }).first().click();
      await page.getByRole('button', { name: 'ประวัติการชำระเงิน' }).click();

      await page.getByRole('combobox').click();
      await page.getByLabel('เติมเงิน').click();
      await page.getByRole('button', { name: 'วันที่เริ่มต้น' }).click();
      await page.getByRole('gridcell', { name: startDay.toString() }).first().click();
      await page.getByRole('button', { name: 'วันที่สิ้นสุด' }).click();
      await page.getByRole('gridcell', { name: endDay.toString() }).last().click();
      //timeout 3 sec
      await page.waitForTimeout(3000);
      //get number from id detail-customer-total
      const listtext = await page.locator('#detail-customer-total').textContent().catch(() => '0');
      const lists = Number.parseFloat((listtext || '0').replace(/[^0-9.-]/g, '')) || 0;

      if (lists === 0) {
        console.log(`No transaction history for user: ${user.name} at ${user.state_at} until ${user.out_end_at}`);

        data.push({
          id: id++,
          name: user.name || 'Unknown',
          creditBefore: user.creditBefore || 0,
          totalCredit: user.totalCredit || 0,
          creditAfter: user.creditAfter || 0,
          state_at: user.state_at || '',
          end_at: user.end_at || '',
          out_end_at: user.out_end_at || '',
          errorCode: user.errorCode || '-'
        });
      } else if (lists > 0) {
        console.log(`Transaction history found for user: ${user.name}`);
        let date_Topup = '';
        let i = 1;
        let credit_history = '';

        do {
          const creditText = await page.locator(`#credit-history-${i}`).textContent().catch(() => '0');
  const dateText = await page.locator(`#date-history-${i}`).textContent().catch(() => '0');

  credit_history = creditText ?? '0';
          date_Topup = dateText ?? '0';
          //set date_Topup ===DD/MM/YYY HH:MM
          date_Topup = date_Topup.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})/, '$2/$1/$3 $4');
          } while ((date_Topup > user.state_at && date_Topup < user.out_end_at) || i > lists);

        //convert credit_history to number
        let creditNum = Number.parseFloat((credit_history || '0').replace(/[^0-9.-]/g, '')) || 0;

        if (i > lists) {
          data.push({
            id: id++,
            name: user.name || 'Unknown',
            creditBefore: user.creditBefore || 0,
            totalCredit: user.totalCredit || 0,
            creditAfter: user.creditAfter || 0,
            state_at: user.state_at || '',
            end_at: user.end_at || '',
            out_end_at: user.out_end_at || '',
            errorCode: user.errorCode || '-'
          });
        } else if (creditNum + user.creditBefore - user.totalCredit !== user.creditAfter) {
          data.push({
            id: id++,
            name: user.name || 'Unknown',
            creditBefore: user.creditBefore || 0,
            totalCredit: user.totalCredit || 0,
            creditAfter: user.creditAfter || 0,
            state_at: user.state_at || '',
            end_at: user.end_at || '',
            out_end_at: user.out_end_at || '',
            errorCode: user.errorCode || '-'
          });
        } else {
          console.log(`User ${user.name} has consistent credit data.`);
        }
      }

      // Navigate back to user management
      await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
      await page.waitForSelector('table', { timeout: 5000 });

    } catch (error) {
      console.error(`Error processing user ${user.name}:`, error.message);
      // Navigate back on error
      await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
      await page.waitForSelector('table', { timeout: 5000 });
    }
  }

  // Save data to notTheSame.json
  try {
    const filePath = path.join(__dirname, 'output/notTheSameAt_15_09_2025.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved ${data.length} records to notTheSame.json`);
    console.log('Data saved:', data);
  } catch (error) {
    console.error('Error saving to notTheSame.json:', error);
  }
});
