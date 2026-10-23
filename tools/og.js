// Genera la imagen para redes: node tools/og.js tools/og.html assets/img/og-image.png (con Playwright)
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.resolve(process.argv[2]), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
