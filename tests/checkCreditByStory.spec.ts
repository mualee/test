import { test, expect } from "@playwright/test";
//using.json
import fs from "fs";
import path from "path";
const usingPath = path.join(__dirname, "../output/using.json");
interface UserData {
  id: number;
  name: string;
  mail?: string;
  phone?: string;
  adjustedCredit: string;
  creditBefore: number;
  totalCredit: number;
  creditAfter: number;
  state_at: string;
  end_at: string;
  out_end_at: string;
  errorCode: string;
}
interface UserDataFilter {
  id: number;
  name: string;
  phone?: string;
  mail?: string;
  creditBefore: number;
  totalCredit: number;
  creditAfter: number;
  credTopup?: number;
  differ: number;
  creditAfterTrue?: number;
  state_at: string;
  end_at: string;
  out_end_at: string;
  topup_at?: string;
  errorCode: string;
}
interface AllCompleted {
  status: string;
  userBugs: number;
  tester: string;
}
const completedUsers: AllCompleted[] = [
  {
    status: "Good",
    userBugs: 0,
    tester: "Can go Home Now  (っ◔◡◔)っ",
  },
];
// Function to parse contact and determine if it's phone or email
function parseContact(contact: string): { mail?: string; phone?: string } {
  const trimmedContact = contact.trim();

  // Check if it's an email (contains @)
  if (trimmedContact.includes("@")) {
    return { mail: trimmedContact };
  }

  // Check if it's a phone number (only digits, possibly with spaces/dashes)
  const digitsOnly = trimmedContact.replace(/[\s-]/g, "");
  if (/^\d+$/.test(digitsOnly)) {
    return { phone: digitsOnly };
  }

  // Default to empty object if neither
  return {};
}

const data: UserData[] = [];
const dataFilter: UserDataFilter[] = [];
//yyyy-mm-dd
const startDate = "2025-11-08";
const endDate = "2025-11-08";
const statusTH = ["กำลังชาร์จ", "ชาร์จเสร็จ"];
const statusEN = ["CHARGING", "COMPLETED"];
// day == getDate() only dd from startDate
const startDay = new Date(startDate).getDate();
const endDay = new Date(endDate).getDate();

// const errorCodeText = ''

test("check customer", async ({ page }) => {
  test.setTimeout(7200000); // 2 hours timeout for processing all records
  await page.goto("https://admin.moveinno.com/");
  // Expect a title "to contain" a substring.
  await page.locator("#username").click();
  await page.locator("#username").fill("Evlaomanager");
  await page.locator("#password").click();
  await page.locator("#password").fill("HQj0[4Ii1Ghj8H2*");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

  await page.getByRole("link", { name: "ประวัติการชาร์จ" }).click();
  // Use a broader date range that's more likely to have data
  await page.goto(
    `https://admin.moveinno.com/move-ev/charging-history-management?page=1&startDate=${startDate}&endDate=${endDate}`
  );
  let countRow = 0;
  let countPage = 0;
  let countPages = 1;
  let id = 0;
  let tableRows = 0;

  // Wait for the page to load and check if there's data
  await page.waitForSelector("table", { timeout: 10000 });

  // Check how many rows are actually in the table
  //loader 2 sec
  await page.waitForTimeout(4000);
  const itemsText = await page
    .locator("#total-charge-history")
    .textContent()
    .catch(() => "0");
  console.log("Raw items text:", itemsText);
  let items =
    Number.parseInt((itemsText || "0").replace(/[^0-9]/g, ""), 10) || 0;
  console.log("Total items found:", items);

  // If no items found, try to count table rows as fallback
  if (items === 0) {
    console.log(
      "No items found with primary selector, trying table row count..."
    );
  } else if (items > 0) {
    console.log("Items found with primary selector:", items);
    // Use totalRows instead of hard-coded 200
    console.log(`Starting loop with ${items} items to process`);

    while (countRow < items) {
      // Check if we need to go to next page (every 50 rows)
      if (countPage === 50) {
        countPages++;
        console.log(`Going to page ${countPages}`);
        await page.goto(
          `https://admin.moveinno.com/move-ev/charging-history-management?page=${countPages}&startDate=${startDate}&endDate=${endDate}`
        );
        await page.waitForSelector("table", { timeout: 10000 });
        countPage = 0; // Reset page counter
        tableRows = 0;
      }

      const errorCodeIndex = countPage + 1;

      console.log(`Processing row ${countRow + 1}...`);

      //wait for the detail page to load
      await page.waitForSelector("#user-full-name-" + (countRow + 1), {
        timeout: 4000,
      });

      // Get all required data in parallel for better performance
      // Debug: log tableRows and selector

      // Optionally log the row's HTML
      // const rowHtml = await page.locator('tr:nth-child(' + (tableRows + 1) + ')').innerHTML().catch(() => 'Row not found');
      // console.log('DEBUG: Row HTML:', rowHtml);
      let [
        fullName,
        adjusted_credit,
        credit_before,
        credit_after,
        contact,
        total_credit,
        status,
        state_at,
        end_at,
        out_end_at,
        errorCodeText,
      ] = await Promise.all([
        page
          .locator("#user-full-name-" + (countRow + 1))
          .textContent()
          .catch(() => ""),
        page
          .locator("#additional-credit-" + (countRow + 1))
          .textContent()
          .catch(() => ""),
        page
          .locator("#credit-before-cal-" + (countRow + 1))
          .textContent()
          .catch(() => "0"),
        page
          .locator("#credit-after-cal-" + (countRow + 1))
          .textContent()
          .catch(() => "0"),
        page
          .locator("#user-contact-field-" + (countRow + 1))
          .textContent()
          .catch(() => "0"),
        page
          .locator("#total-credit-" + (countRow + 1))
          .textContent()
          .catch(() => "0"),
        page
          .locator("#status-" + (countRow + 1))
          .textContent()
          .catch(() => ""),
        page
          .locator("#charge-start-time-" + (countRow + 1))
          .textContent()
          .catch(() => ""),
        page
          .locator("#charge-end-time-" + (countRow + 1))
          .textContent()
          .catch(() => ""),
        page
          .locator("#unplug-time-" + (countRow + 1))
          .textContent()
          .catch(() => ""),
        page
          .locator(`tr:nth-child(${errorCodeIndex}) > td:nth-child(16)`)
          .textContent()
          .catch(() => ""),
      ]);

      // Convert string values to numbers with better parsing
      const adjusted =
        parseInt((adjusted_credit || "0").replace(/[^0-9-]/g, ""), 10) || 0;
      const before =
        parseInt((credit_before || "0").replace(/[^0-9-]/g, ""), 10) || 0;
      const after =
        parseInt((credit_after || "0").replace(/[^0-9-]/g, ""), 10) || 0;
      const totalCredit =
        parseInt((total_credit || "0").replace(/[^0-9-]/g, ""), 10) || 0;
      let somethingError = adjusted === 0 && totalCredit === 0 && after === 0;
      // Convert contact to mail and phone from contact
      const contactInfo = parseContact(contact || "");

      // ###########################################################################

      // # ທຸກຄົນ ທີ  ສາກແລ້ວ[1] ແລະ ເງີນບໍ່ຕົງ ແລະ ມີໜີ
      if (
        status === statusTH[1] ||
        (status === statusEN[1] && !somethingError)
      ) {
        if (before - totalCredit !== after && !somethingError) {
          data.push({
            id: id++,
            name: fullName || "Unknown",
            ...contactInfo,
            adjustedCredit: adjusted_credit || " ",
            creditBefore: before || 0,
            totalCredit: totalCredit || 0,
            creditAfter: after || 0,
            state_at: state_at || "",
            end_at: end_at || "",
            out_end_at: out_end_at || "",
            errorCode: errorCodeText || "",
          });

          console.log(
            `Mismatch found at row ${
              countRow + 1
            } name: ${fullName} - before(${before}) - used(${totalCredit}) !== after(${after}) adjusted_credit: ${adjusted_credit}`
          );
        }
      }

      console.log(`item is ${items - (countRow + 1)} / ${itemsText}`);
      countPage++;
      countRow++;

      // Navigate back with error handling
    }
  }

  //#########################################################################################
  await page.getByRole("link", { name: "จัดการลูกค้า" }).first().click();
  await page.goto("https://admin.moveinno.com/move-ev/user-management?page=1");
  await page.waitForSelector("table", { timeout: 50000 });
  id = 0;
  console.log(`all users ==== ${data.length} `);
  for (const user of data) {
    try {
      console.log(`Processing id ${user.id} user: ${user.name}`);
      if (user.name && user.name !== "-" && user.name !== "_") {
        const searchBox = page.getByPlaceholder("ค้นหาด้วยชื่อ และ นามสกุล");
        await searchBox.clear();
        await searchBox.fill(user.name);
        await page.waitForTimeout(5000);
        // ກວດຊື່ຄືກັນ
        const itemsLocator = page.locator(
          'xpath=//*[@id="root"]/div/main/div[2]/div/div[2]/div[2]/div[1]/div[1]'
        );
        await itemsLocator
          .waitFor({ state: "visible", timeout: 5000 })
          .catch(() => {
            console.log("Items count element not visible");
          });
        const itemsText = await itemsLocator.textContent().catch(() => {
          console.log("Failed to get items text, using 0");
          return "0";
        });
        console.log("Raw items text:", itemsText);
        let items =
          Number.parseInt((itemsText || "0").replace(/[^0-9]/g, ""), 10) || 0;
        console.log("Total items found:", items);

        if (items > 1) {
          if (user.phone) {
            const searchBoxPhone = page.getByPlaceholder("ค้นหาด้วยเบอร์โทร");
            await searchBoxPhone.clear();
            await searchBoxPhone.fill(user.phone);
            await page.waitForTimeout(3000);
             await page
        .getByRole("cell", { name: `+856 ${user.phone}`, exact: true })
        .first()
        .click();
          } else if (user.mail) {
            const searchBoxMail = page.getByPlaceholder("ค้นหาด้วยอีเมล");
            await searchBoxMail.clear();
            await searchBoxMail.fill(user.mail);
            await page.waitForTimeout(3000);
             await page
        .getByRole("cell", { name: user.mail, exact: true })
        .first()
        .click();
          }
        } else if (items === 0) {
          if (user.phone) {
            const searchBox = page.getByPlaceholder(
              "ค้นหาด้วยชื่อ และ นามสกุล"
            );
            await searchBox.clear();
            await searchBox.fill("");
            const searchBoxPhone = page.getByPlaceholder("ค้นหาด้วยเบอร์โทร");
            await searchBoxPhone.clear();
            await searchBoxPhone.fill(user.phone);
            await page.waitForTimeout(3000);
            await page
        .getByRole("cell", { name: `+856 ${user.phone}`, exact: true })
        .first()
        .click();
          } else if (user.mail) {
            const searchBox = page.getByPlaceholder(
              "ค้นหาด้วยชื่อ และ นามสกุล"
            );
            await searchBox.clear();
            await searchBox.fill("");
            const searchBoxMail = page.getByPlaceholder("ค้นหาด้วยอีเมล");
            await searchBoxMail.clear();
            await searchBoxMail.fill(user.mail);
            await page.waitForTimeout(3000);
              await page
        .getByRole("cell", { name: user.mail, exact: true })
        .first()
        .click();
          }
        }else {
            await page
        .getByRole("cell", { name: user.name, exact: true })
        .first()
        .click();
        }
      } else if (!user.name || user.name === "-" || user.name === "_") {
        if (user.phone) {
          const searchBox = page.getByPlaceholder("ค้นหาด้วยชื่อ และ นามสกุล");
          await searchBox.clear();
          await searchBox.fill("");
          const searchBoxPhone = page.getByPlaceholder("ค้นหาด้วยเบอร์โทร");
          await searchBoxPhone.clear();
          await searchBoxPhone.fill(user.phone);
          await page.waitForTimeout(3000);
          await page
        .getByRole("cell", { name: `+856 ${user.phone}`, exact: true })
        .first()
        .click();
        } else if (user.mail) {
          const searchBox = page.getByPlaceholder("ค้นหาด้วยชื่อ และ นามสกุล");
          await searchBox.clear();
          await searchBox.fill("");
          const searchBoxMail = page.getByPlaceholder("ค้นหาด้วยอีเมล");
          await searchBoxMail.clear();
          await searchBoxMail.fill(user.mail);
          await page.waitForTimeout(3000);
            await page
        .getByRole("cell", { name: user.mail, exact: true })
        .first()
        .click();
        }
      }

      // await page
      //   .getByRole("cell", { name: user.name, exact: true })
      //   .first()
      //   .click();
      await page.getByRole("button", { name: "ประวัติการชำระเงิน" }).click();

      await page.getByRole("combobox").click();
      await page.getByLabel("เติมเงิน").click();
      await page.getByRole("button", { name: "วันที่เริ่มต้น" }).click();
      await page
        .getByRole("gridcell", { name: startDay.toString(), exact: true })
        .first()
        .click();
      await page.getByRole("button", { name: "วันที่สิ้นสุด" }).click();
      await page
        .getByRole("gridcell", { name: endDay.toString(), exact: true })
        .first()
        .click();
      await page.waitForTimeout(2000);
      const listtext = await page
        .locator("#detail-customer-total")
        .textContent()
        .catch(() => "can not Loading...");
      if (listtext === "can not Loading...") {
        console.log(`No see history for user: ${user.name}`);
        continue;
      }

      const lists =
        Number.parseFloat((listtext || "0").replace(/[^0-9.-]/g, "")) || 0;

      const createUserRecord = (creditNum: number, topupDate: string) => ({
        id: id++,
        name: user.name,
        creditBefore: user.creditBefore,
        totalCredit: user.totalCredit,
        creditAfter: user.creditAfter,
        credTopup: creditNum,
        differ: (user.creditBefore + creditNum - user.totalCredit) - user.creditAfter,
        creditAfterTrue: user.creditBefore + creditNum - user.totalCredit,
        state_at: user.state_at,
        end_at: user.end_at,
        out_end_at: user.out_end_at,
        topup_at: topupDate,
        errorCode: user.errorCode,
      });

      if (lists === 0) {
        console.log(`No transaction history for user: ${user.name}`);
        dataFilter.push(createUserRecord(0, "No Topup"));
      } else {
        console.log(`Transaction history found for user: ${user.name}`);
        let credit_history = "0";
        let date_Topup = "No Topup";
        let hasTopup = false;

        for (let i = 1; i <= lists && !hasTopup; i++) {
          const [creditText, dateText] = await Promise.all([
            page
              .locator(`#credit-history-${i}`)
              .textContent()
              .catch(() => "0"),
            page
              .locator(`#date-history-${i}`)
              .textContent()
              .catch(() => "0"),
          ]);

          credit_history = creditText ?? "0";
          const rawDate = dateText ?? "0";
          date_Topup = rawDate;

          // Convert to Date objects for proper comparison
          const topupTime = new Date(date_Topup);
          const startTime = new Date(user.state_at);
          const endTime = new Date(user.out_end_at);

          hasTopup = topupTime >= startTime && topupTime <= endTime;
        }

        if (!hasTopup) {
          console.log(`No topup found for ${user.name}`);
          dataFilter.push(createUserRecord(0, "No Topup"));
        } else {
          const creditNum =
            Number.parseFloat(credit_history.replace(/[^0-9.-]/g, "")) || 0;
          const creditAfterTrue =
            user.creditBefore + creditNum - user.totalCredit;

          if (creditAfterTrue !== user.creditAfter) {
            dataFilter.push(createUserRecord(creditNum, date_Topup));
            console.log(
              `Credit mismatch for ${user.name}: expected ${creditAfterTrue}, got ${user.creditAfter}`
            );
          } else {
            console.log(`${user.name}: credit consistent`);
          }
        }
      }

      await page.goto(
        "https://admin.moveinno.com/move-ev/user-management?page=1"
      );
      await page.waitForSelector("table", { timeout: 5000 });
    } catch (error) {
      console.error(
        `Error processing user ${user.name}:`,
        error instanceof Error ? error.message : String(error)
      );
      // Navigate back on error
      await page.goto(
        "https://admin.moveinno.com/move-ev/user-management?page=1"
      );
      await page.waitForSelector("table", { timeout: 5000 });
    }
  }

  //check data
  if (dataFilter.length === 0) {
    dataFilter.push(...(completedUsers as any));
  }

  // Save data to using.json
  try {
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, "0")}-${String(
      now.getMinutes()
    ).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;

    // Create the CheckOn_ folder if it doesn't exist
    const outputDir = path.join(__dirname, "output/CheckOn_" + startDate);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(
      __dirname,
      "output/CheckOn_" +
        startDate +
        "/AllUsedsIn" +
        startDate +
        "-" +
        endDate +
        "Test_at" +
        timestamp +
        ".json"
    );
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    const filePathFilter = path.join(
      __dirname,
      "output/CheckOn_" +
        startDate +
        "/CreditCheck_" +
        startDate +
        "-" +
        endDate +
        "Test_at" +
        timestamp +
        ".json"
    );
    fs.writeFileSync(
      filePathFilter,
      JSON.stringify(dataFilter, null, 2),
      "utf8"
    );
    console.log(`Saved ${dataFilter.length} records to using.json`);
    console.log("Data saved:", dataFilter);
  } catch (error) {
    console.error("Error saving to using.json:", error);
  }
});
