import puppeteer from 'puppeteer';

(async () => {
  const BASE_URL = process.env.BASE_URL || 'https://hanaihang.netlify.app';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 60000 });

  // ตรวจว่ามีการ์ดห้างขึ้น
  const cards = await page.$$('[data-testid="mall-card"]');
  if (!cards.length) {
    console.error('❌ No mall cards found on Home');
    process.exit(1);
  }
  console.log(`✅ Found ${cards.length} mall cards`);

  await browser.close();
})();
