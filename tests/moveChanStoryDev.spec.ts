import { test, expect } from '@playwright/test';

// Test constants
const BASE_URL = 'http://move-admin-dev-team.s3-website-ap-southeast-1.amazonaws.com';
const CREDENTIALS = {
  username: 'SuperAdmin',
  password: '123456'
};
const TEST_TIMEOUT = 7200000; // 2 hours
const stationID=['6937eaa7125d60c54bec726d', '69368da6af15e13b1e1de47d','693656f2995611af3d8c5762','69294cc6c863566b7bb4d21f','691a994e6809cb889fc73b9e','6879d28bac60a8cb2582b680','686b461d24f0bfcaa9c6a718','686b3e7024f0bfcaa9c6a5b6','686b3c2624f0bfcaa9c6a4f9','686752290866823bc4ab8772','6867488c1da3c3ed57e7c8a0','683ec1c276ad9da46d655117','683e693badcce7c6c2e8932d','682ec9f5be720ab7146519b1','682d979cbe720ab71464ec31','682d9765be720ab71464ec0c','67e5053501345208e094280f','67e0467ad31429e3f823586f','67dcccdb0183899e2c139cfc','67dbe62a0183899e2c138feb','67da3302fb94ca9a307e401c'];
const indata =['01/05/2026','12/22/2025','11/22/2025','10/22/2025','9/22/2025','8/22/2025','7/22/2025','6/22/2025','5/22/2025','4/22/2025','3/22/2025','2/22/2025','1/22/2025','12/22/2024','11/22/2024','10/22/2024','9/22/2024','8/22/2024','7/22/2024','6/22/2024','5/22/2024','4/22/2024','3/22/2024','2/22/2024','1/22/2024'];
const moneyType =['LAK','THB','USD'];
const payFor=['ดู Netfix เดือนก่อนน๊','ຄ່ານ້ຳປະປາ ປີ 2025 v2','ຄ່ານ້ຳ 2030','Liverpool 7-0 Man United (Mar 5, 2023)','tester','ຄ່າໄຟ']


test('should add new expense successfully', async ({ page }) => {
  test.setTimeout(TEST_TIMEOUT);
  
  // Login
  await page.goto(BASE_URL);
  await page.locator('#username').fill(CREDENTIALS.username);
  await page.locator('#password').fill(CREDENTIALS.password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  
  // Wait for successful login
  await expect(page).toHaveURL(/.*super-admin.*/, { timeout: 10000 });

  
  // Navigate to expense management
  await page.getByRole('button', { name: 'จัดการค่าใช้จ่าย' }).click();
  await page.getByRole('link', { name: 'ค่าใช้จ่าย', exact: true }).click();
  await expect(page).toHaveURL(`${BASE_URL}/super-admin/expense-info?page=1`);
  
 for (let i = 0; i < stationID.length; i++) {

  for (let j = 0; j < indata.length; j++) {

    for (let k = 0; k < moneyType.length; k++) {
      for (let m = 0; m < payFor.length; m++) {
        
       // Start adding new expense
  await page.getByRole('button', { name: 'เพิ่มค่าใช้จ่าย' }).click();
  await expect(page).toHaveURL(`${BASE_URL}/super-admin/expense-info/add`);
  
  // Fill expense form
 const locator = page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[2]/div[2]/div/form/div/div[1]/div/div/select');

  await locator.selectOption(stationID[i]);
  
  
  // Select payment date - fill with full date MM/DD/YYYY
  const dateInput = page.locator('input[type="text"]').first();
  await dateInput.click();
  await dateInput.fill(indata[j]);
  await dateInput.press('Enter');
  
  // Select currency and exchange rate
  await page.locator('button').filter({ hasText: 'LAK' }).click();
  await page.getByLabel(moneyType[k]).getByText(moneyType[k]).click();
  
  if (k>0){
await page.getByPlaceholder('ป้อนอัตราแลกเปลี่ยน').fill('1100');
  }else{
    await page.getByPlaceholder('ป้อนอัตราแลกเปลี่ยน').fill('1');
  }
  
  // Select expense category
  await page.getByRole('combobox').nth(3).click();
  await page.getByLabel(payFor[m]).getByText(payFor[m]).click();
  
  // Enter amount and details - random amount between 500000 and 5000000
  const randomAmount = Math.floor(Math.random() * (5000000 - 500000 + 1)) + 500000;
  await page.getByPlaceholder('ป้อนจำนวนเงิน').fill(randomAmount.toString());
  await page.getByPlaceholder('ป้อนรายละเอียด').fill('test');
  
  // Upload file
  await page.locator('input[type="file"]').setInputFiles('C:\\Users\\muale\\Music\\test\\tests\\test.png');
  
  // Add notes
  await page.getByPlaceholder('ป้อนหมายเหตุเพิ่มเติม').fill('ttt');
  
  // Submit and verify success
  await page.getByRole('button', { name: 'บันทึก' }).click();
  
  // Verify redirect to expense list after successful creation
   await expect(page).toHaveURL(/.*expense-info\?page=.*/, { timeout: 10000 });
  //set timeout to 20 seconds

  // await page.waitForTimeout(1000);
  // await expect(page).toHaveURL(`${BASE_URL}/super-admin/expense-info?page=1`);                                      
    
      }
    }
  }

 }
  //close browser
  await page.close();
 console.log('add completed successfully');

});
 