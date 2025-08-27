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
const startDate = '2025-08-27';
const endDate = '2025-08-27';
const statusTH = ["กำลังชาร์จ", "ชาร์จเสร็จ"]
const statusEN = ["CHARGING", "COMPLETED"]

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

  await page.getByRole('link', { name: 'ประวัติการชาร์จ' }).click();
  // Use a broader date range that's more likely to have data
  await page.goto(`https://admin.moveinno.com/move-ev/charging-history-management?page=1&startDate=${startDate}&endDate=${endDate}`);
let countRow = 0;
  let countPage = 0;
  let countPages = 1;
  let id = 0;

  // Wait for the page to load and check if there's data
  await page.waitForSelector('table', { timeout: 10000 });

  // Check how many rows are actually in the table
//loader 2 sec
  await page.waitForTimeout(4000);
  const itemsText = await page.locator('#total-charge-history').textContent().catch(() => '0');
  console.log('Raw items text:', itemsText);
  let items = Number.parseInt((itemsText || '0').replace(/[^0-9]/g, ''), 10) || 0;
  console.log('Total items found:', items);

  // If no items found, try to count table rows as fallback
  if (items === 0) {
    console.log('No items found with primary selector, trying table row count...');



  } else if (items > 0) {

   console.log('Items found with primary selector:', items);
  // Use totalRows instead of hard-coded 200
  console.log(`Starting loop with ${items} items to process`);

   while (countRow < items) {

    // Check if we need to go to next page (every 50 rows)
    if (countPage === 50) {
      countPages++;
      console.log(`Going to page ${countPages}`);
      await page.goto(`https://admin.moveinno.com/move-ev/charging-history-management?page=${countPages}&startDate=${startDate}&endDate=${endDate}`);
      await page.waitForSelector('table', { timeout: 10000 });
      countPage = 0; // Reset page counter
    }



      console.log(`Processing row ${countRow + 1}...`);

      //wait for the detail page to load
      await page.waitForSelector('#user-full-name-'+(countRow+1), { timeout: 40000 });

      // Get all required data in parallel for better performance
      const [fullName, credit_before, credit_after, total_credit,status] = await Promise.all([
        page.locator('#user-full-name-'+(countRow+1)).textContent().catch(() => ''),
        page.locator('#credit-before-cal-'+(countRow+1)).textContent().catch(() => '0'),
        page.locator('#credit-after-cal-'+(countRow+1)).textContent().catch(() => '0'),
        page.locator('#total-credit-now-' + (countRow + 1)).textContent().catch(() => '0'),
        page.locator('#status-' + (countRow + 1)).textContent().catch(() => '')
      ]);

      // Convert string values to numbers with better parsing
      const before = parseInt((credit_before || '0').replace(/[^0-9]/g, ''), 10) || 0;
      const after = parseInt((credit_after || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const totalCredit = parseInt((total_credit || '0').replace(/[^0-9]/g, ''), 10) || 0;
 // ###########################################################################
      // # ທຸກຄົນ
    //   data.push({
    //     id: id++,
    //     name: fullName || 'Unknown',
    //     creditBefore: before,
    //     totalCredit: totalCredit,
    //     creditAfter: after
    // });

     // console.log(`Row ${countRow + 1}: ${fullName} - before(${before}) - used(${totalCredit}) = after(${after})`);
   //#################################################################################
     // # ທຸກຄົນ ທີ ກຳລັັງສາກ [0]
     // if (status === statusTH[0] || status === statusEN[0]) {
    //    data.push({
    //     id: id++,
    //     name: fullName || 'Unknown',
    //     creditBefore: before,
    //     totalCredit: totalCredit,
    //     creditAfter: after
    // });
    // console.log(`Row ${countRow + 1}: status = ${status} name: ${fullName} - before(${before}) - used(${totalCredit}) = after(${after})`);

     // }
     //#######################################################################################
     // # ທຸກຄົນ ທີ  ສາກແລ້ວ[1]
    if (status === statusTH[1] || status === statusEN[1]) {
       data.push({
        id: id++,
        name: fullName || 'Unknown',
        creditBefore: before,
        totalCredit: totalCredit,
        creditAfter: after
    });
    console.log(`Row ${countRow + 1}: status = ${status} name: ${fullName} - before(${before}) - used(${totalCredit}) = after(${after})`);

    }

    //# //#################################################################################
     // # ທຸກຄົນ ທີ ເງີນບໍ່ຕົງ
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
     //#################################################################################
     // # ທຸກຄົນ ທີ  ສາກແລ້ວ[1] ແລະ ເງີນບໍ່ຕົງ
    // if (status === statusTH[1] || status === statusEN[1]) {
    //    if (before - totalCredit !== after) {
    //   data.push({
    //     id: id++,
    //     name: fullName || 'Unknown',
    //     creditBefore: before,
    //     totalCredit: totalCredit,
    //     creditAfter: after
    //   });

    //   console.log(`Mismatch found at row ${countRow + 1}: before(${before}) - used(${totalCredit}) !== after(${after})`);
    //  }
    // }


    console.log(`item is ${items}`);
      countPage++;
      countRow++;

      // Navigate back with error handling



  }

  }

  // Save data to using.json
  try {
    const filePath = path.join(__dirname, 'Allused.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved ${data.length} records to using.json`);
    console.log('Data saved:', data);
  } catch (error) {
    console.error('Error saving to using.json:', error);
  }
});
