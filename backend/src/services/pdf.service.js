const puppeteer = require('puppeteer');

exports.generatePDF = async html => {
  if (!html || html.length < 100) {
    throw new Error('HTML inválido para geração de PDF');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: 'networkidle0'
  });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div></div>`,
    footerTemplate: `
      <div style="font-size:9px;width:100%;text-align:center;">
        Página <span class="pageNumber"></span> de
        <span class="totalPages"></span>
      </div>
    `,
    margin: {
      top: '18mm',
      bottom: '22mm',
      left: '15mm',
      right: '15mm'
    }
  });

  await browser.close();
  return pdf;
};
