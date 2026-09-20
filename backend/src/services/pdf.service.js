const puppeteer = require("puppeteer");

exports.generatePDF = async (html) => {
  if (!html || html.length < 100) {
    throw new Error("HTML inválido ou muito curto para geração de PDF");
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; text-align: center; color: #666;">
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `,
      margin: {
        top: "12mm",
        bottom: "16mm",
        left: "10mm",
        right: "10mm",
      },
    });

    return pdf;
  } catch (error) {
    console.error("Erro crítico durante a geração do PDF no Puppeteer:", error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};