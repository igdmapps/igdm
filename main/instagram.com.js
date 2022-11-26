const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: false
});

const browserContext = await browser.newContext();

const tab = await browserContext.newPage();

await tab.goto('https://instagram.com')

async function login (username, password) {
  await tab.locator('').fill(username)
  await tab.locator('').fill(password)
  await tab.locator('').click()
  
  
}