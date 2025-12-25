import { test, expect } from '@playwright/test';
//using.json
import fs from 'fs';
import path from 'path';
const inputFilePath = path.join(__dirname, './output/AllUsedsIn2025-12-23-2025-12-23Test_at10-38-31.json');

console.log('Looking for file at:', inputFilePath);

let json: UserData[] = [];
if (fs.existsSync(inputFilePath)) {
  json = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));
  // Remove trailing spaces from user names
  json = json.map(user => ({
    ...user,
    name: user.name.trimEnd()
  }));
  console.log(`Loaded ${json.length} records from file`);
} else {
  console.log('Input file not found, using empty array');
}
//edit json data user.name 
interface UserData {
  id: number;
  name: string;
  phone?: string;
  mail?: string;
  creditBefore: number;
  totalCredit: number;
  creditAfter: number;
  credTopup?: number;
  creditAfterTrue?: number;
  state_at: string;
  end_at: string;
  out_end_at: string;
  topup_at?: string;
  errorCode: string;
}


const data: UserData[] = [];
const startDate = '2025-12-23';
const endDate = '2025-12-23';
const statusTH = ["กำลังชาร์จ", "ชาร์จเสร็จ"]
const statusEN = ["CHARGING", "COMPLETED"]
// day == getDate() only dd from startDate
const startDay = new Date(startDate).getDate();
const endDay = new Date(endDate).getDate();
// const errorCodeText = ''

test('check customer', async ({ page }) => {
  test.setTimeout(7200000); // 2 hours timeout for processing all records
  await page.goto('https://admin.moveinno.com/');
  await page.locator('#username').fill('Evlaomanager');
  await page.locator('#password').fill('HQj0[4Ii1Ghj8H2*');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.getByRole('link', { name: 'จัดการลูกค้า' }).first().click(); 
  await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
  await page.waitForSelector('table', { timeout: 50000 });
  let id = 0;
  
  for (const user of json) {
    try {
      
      console.log(`Processing id ${user.id} user: ${user.name}`);
      if (user.name && (user.name !== '-' && user.name !== '_')) {
        const searchBox = page.getByPlaceholder('ค้นหาด้วยชื่อ และ นามสกุล');
      await searchBox.clear();
      await searchBox.fill(user.name);
      await page.waitForTimeout(3000);
      // ກວດຊື່ຄືກັນ
      const itemsLocator = page.locator('xpath=//*[@id="root"]/div/main/div[2]/div/div[2]/div[2]/div[1]/div[1]');
      await itemsLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        console.log('Items count element not visible');
      });
      const itemsText = await itemsLocator.textContent().catch(() => {
        console.log('Failed to get items text, using 0');
        return '0';
      });
      console.log('Raw items text:', itemsText);
      let items = Number.parseInt((itemsText || '0').replace(/[^0-9]/g, ''), 10) || 0;
      console.log('Total items found:', items);
      console.log('Total items found:', items);
      console.log('Total items found:', items);
      console.log('Total items found:', items);
      console.log('Total items found:', items);
      console.log('Total items found:', items);
      console.log('Total items found:', items);
      console.log('Total items found:', items);
      console.log('Total items found:', items);
        if (items >1) {
          if (user.phone) {
        const searchBoxPhone = page.getByPlaceholder('ค้นหาด้วยเบอร์โทร');
      await searchBoxPhone.clear();
      await searchBoxPhone.fill(user.phone);
      await page.waitForTimeout(800);
      }else  if (user.mail){
      const searchBoxMail = page.getByPlaceholder('ค้นหาด้วยอีเมล');
      await searchBoxMail.clear();
      await searchBoxMail.fill(user.mail);
      await page.waitForTimeout(800);
      }
        }else if (items === 0) {
          if (user.phone) {
        const searchBox = page.getByPlaceholder('ค้นหาด้วยชื่อ และ นามสกุล');
      await searchBox.clear();
      await searchBox.fill("");
      const searchBoxPhone = page.getByPlaceholder('ค้นหาด้วยเบอร์โทร');
      await searchBoxPhone.clear();
      await searchBoxPhone.fill(user.phone);
      await page.waitForTimeout(800);
      }else  if (user.mail){
      const searchBox = page.getByPlaceholder('ค้นหาด้วยชื่อ และ นามสกุล');
      await searchBox.clear();
      await searchBox.fill("");
      const searchBoxMail = page.getByPlaceholder('ค้นหาด้วยอีเมล');
      await searchBoxMail.clear();
      await searchBoxMail.fill(user.mail);
      await page.waitForTimeout(800);
      }
        }

      } else if (!user.name || (user.name==='-' || user.name==='_')) {
        if (user.phone) {
        const searchBox = page.getByPlaceholder('ค้นหาด้วยชื่อ และ นามสกุล');
      await searchBox.clear();
      await searchBox.fill("");
      const searchBoxPhone = page.getByPlaceholder('ค้นหาด้วยเบอร์โทร');
      await searchBoxPhone.clear();
      await searchBoxPhone.fill(user.phone);
      await page.waitForTimeout(800);
      }else  if (user.mail){
      const searchBox = page.getByPlaceholder('ค้นหาด้วยชื่อ และ นามสกุล');
      await searchBox.clear();
      await searchBox.fill("");
      const searchBoxMail = page.getByPlaceholder('ค้นหาด้วยอีเมล');
      await searchBoxMail.clear();
      await searchBoxMail.fill(user.mail);
      await page.waitForTimeout(800);
      }
      }

      
      
      

      await page.getByRole('cell', { name: user.name, exact: true }).first().click();
      await page.getByRole('button', { name: 'ประวัติการชำระเงิน' }).click();

      await page.getByRole('combobox').click();
      await page.getByLabel('เติมเงิน').click();
      await page.getByRole('button', { name: 'วันที่เริ่มต้น' }).click();
      await page.getByRole('gridcell', { name: startDay.toString() }).first().click();
      await page.getByRole('button', { name: 'วันที่สิ้นสุด' }).click();
      await page.getByRole('gridcell', { name: endDay.toString() }).first().click();
      await page.waitForTimeout(2000);
      const listtext = await page.locator('#detail-customer-total').textContent().catch(() => 'can not Loading...');
      if (listtext === 'can not Loading...') {
        console.log(`No see history for user: ${user.name}`);
        continue;
      }
      
      const lists = Number.parseFloat((listtext || '0').replace(/[^0-9.-]/g, '')) || 0;
      
      const createUserRecord = (creditNum: number, topupDate: string) => ({
        id: id++,
        name: user.name,
        creditBefore: user.creditBefore,
        totalCredit: user.totalCredit,
        creditAfter: user.creditAfter,
        credTopup: creditNum,
        creditAfterTrue: (user.creditBefore + creditNum) - user.totalCredit,
        state_at: user.state_at,
        end_at: user.end_at,
        out_end_at: user.out_end_at,
        topup_at: topupDate,
        errorCode: user.errorCode
      });

      if (lists === 0) {
        console.log(`No transaction history for user: ${user.name}`);
        data.push(createUserRecord(0, 'No Topup'));
      } else {
        console.log(`Transaction history found for user: ${user.name}`);
        let credit_history = '0';
        let date_Topup = 'No Topup';
        let hasTopup = false;

        for (let i = 1; i <= lists && !hasTopup; i++) {
          const [creditText, dateText] = await Promise.all([
            page.locator(`#credit-history-${i}`).textContent().catch(() => '0'),
            page.locator(`#date-history-${i}`).textContent().catch(() => '0')
          ]);

          credit_history = creditText ?? '0';
          const rawDate = dateText ?? '0';
          date_Topup = rawDate.replace(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}):\d{2}/, '$1');
          
          hasTopup = date_Topup >= user.state_at && date_Topup <= user.out_end_at;
        }

        if (!hasTopup) {
          console.log(`No topup found for ${user.name}`);
          data.push(createUserRecord(0, 'No Topup'));
        } else {
          const creditNum = Number.parseFloat(credit_history.replace(/[^0-9.-]/g, '')) || 0;
          const creditAfterTrue = (user.creditBefore + creditNum) - user.totalCredit;

          if (creditAfterTrue !== user.creditAfter) {
            data.push(createUserRecord(creditNum, date_Topup));
            console.log(`Credit mismatch for ${user.name}: expected ${creditAfterTrue}, got ${user.creditAfter}`);
          } else {
            console.log(`${user.name}: credit consistent`);
          }
        }
      }

      await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
      await page.waitForSelector('table', { timeout: 5000 });
      
    } catch (error) {
      console.error(`Error processing user ${user.name}:`, error instanceof Error ? error.message : String(error));
      // Navigate back on error
      await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
      await page.waitForSelector('table', { timeout: 5000 });
    }
  }

  try {
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const filePath = path.join(__dirname, `output/creditCheck_${startDate}_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n✓ Saved ${data.length} records to ${path.basename(filePath)}`);
  } catch (error) {
    console.error('Error saving file:', error);
  }
});
