import { test, expect } from '@playwright/test';
//using.json
import fs from 'fs';
import path from 'path';
const usingPath = path.join(__dirname, '../output/AllUsedsIn2025-12-26-2025-12-26Test_at17-17-16.json');
const AllusedsIn10_12_2025 = path.join(__dirname, './output/AllUsedsIn2025-12-26-2025-12-26Test_at17-17-16.json');
// import json from '../output/AllusedsIn10_12_2025.json';
const datas = AllusedsIn10_12_2025 && fs.existsSync(AllusedsIn10_12_2025) ? JSON.parse(fs.readFileSync(AllusedsIn10_12_2025, 'utf-8')) : [];

console.log('Looking for file at:', AllusedsIn10_12_2025);
console.log('File exists:', fs.existsSync(AllusedsIn10_12_2025));

// Only try to read the file if it exists
let json: UserData[] = [];
if (fs.existsSync(AllusedsIn10_12_2025)) {
  json = JSON.parse(fs.readFileSync(AllusedsIn10_12_2025, 'utf-8'));
  console.log('Using JSON data:', json);
} else {
  console.log('AllusedsIn10_12_2025.json file not found, using empty array');
}



interface UserData {
  id: number;
  name: string;
  phone?: string;
  mail?: string;
  creditBefore?: number;

  totalCredit?: number;
  creditAfter?: number;
  credTopup?: number;
  inWallet?: number;
  creditAfterTrue?: number;
  state_at?: string;
  end_at?: string;
  out_end_at?: string;
  topup_at?: string;
  errorCode?: string;
}

// Group users by name and get the latest record by out_end_at
const userMap = new Map<string, UserData>();

for (const user of json) {
  // Create a unique key based on name and available contact info
  let userKey: string;
  if (user.phone) {
    userKey = `${user.name}|phone:${user.phone}`;
  } else if (user.mail) {
    userKey = `${user.name}|mail:${user.mail}`;
  } else {
    userKey = `${user.name}|no-contact`;
  }
  
  const existingUser = userMap.get(userKey);
  
  if (!existingUser) {
    // First occurrence of this user combination
    userMap.set(userKey, user);
  } else {
    // Compare out_end_at dates to keep the latest one
    const existingDate = existingUser.out_end_at || '';
    const currentDate = user.out_end_at || '';
    
    if (currentDate > existingDate) {
      // Current user has a later out_end_at, replace the existing one
      userMap.set(userKey, user);
    }
  }
}

// Convert map back to array for processing
const json_to_check_credit: UserData[] = Array.from(userMap.values());

console.log(`Original JSON records: ${json.length}`);
console.log(`Unique users to check: ${json_to_check_credit.length}`);

const data: UserData[] = [];
// const startDate = '2025-11-30';
// const endDate = '2025-11-30';
// const statusTH = ["กำลังชาร์จ", "ชาร์จเสร็จ"]
// const statusEN = ["CHARGING", "COMPLETED"]
// // day == getDate() only dd from startDate
// const startDay = new Date(startDate).getDate();
// const endDay = new Date(endDate).getDate();
// const errorCodeText = ''

test('check customer', async ({ page }) => {
  test.setTimeout(7200000); // 2 hours timeout for processing all records
  await page.goto('https://admin.moveinno.com/');
 await page.locator('#username').click();
  await page.locator('#username').fill('Evlaomanager');
  await page.locator('#password').click();
  await page.locator('#password').fill('HQj0[4Ii1Ghj8H2*');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

await page.getByRole('link', { name: 'จัดการลูกค้า' }).first().click();  // Use a broader date range that's more likely to have data
  await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
let countRow = 0;
  let countPage = 0;
  let countPages = 1;
  let id = 0;
  let Topup=false;



  //loop by array json_to_check_credit (filtered for latest records only)
  for (const user of json_to_check_credit) {
    try {
      console.log(`Processing id ${user.id} user: ${user.name} (latest out_end_at: ${user.out_end_at})`);

      // Clear search field and search for user
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
      // Wait for search results 0.8s

            await page.getByRole('cell', { name: user.name, exact: true }).first().click();

      await page.waitForTimeout(3000);
      
      //get number from id InWallet
      const InWalletText = await page.locator("#InWallet").textContent().catch(() => '0');
      const InWallet = Number.parseFloat((InWalletText || '0').replace(/[^0-9.-]+/g, '')) || 0;
      if (InWallet === user.creditAfter) {
        console.log("Credit matches InWallet, no action needed.");
      }
      else  {
        data.push({
            id: id++,
            name: user.name || 'Unknown',
         
            creditAfter: user.creditAfter || 0,
            inWallet: InWallet || 0,
            
            errorCode: user.errorCode || '-'
          });
      }
      // Navigate back to user management
      await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
      await page.waitForSelector('table', { timeout: 5000 });

    } catch (error) {
      console.error(`Error processing user ${user.name}:`, error instanceof Error ? error.message : String(error));
      // Navigate back on error
      await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
      await page.waitForSelector('table', { timeout: 5000 });
    }
  }

  // Save data to notTheSame.json
  try {
     const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    
    const filePath = path.join(__dirname, `output/notTheSameWallet_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved ${data.length} records to notTheSame.json`);
    console.log('Data saved:', data);
  } catch (error) {
    console.error('Error saving to notTheSame.json:', error);
  }
});
