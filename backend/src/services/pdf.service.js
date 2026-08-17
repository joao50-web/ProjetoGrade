const puppeteer = require("puppeteer");

exports.generatePDF = async (html) => {
  // 1. Validação prévia do input
  if (!html || html.length < 100) {
    throw new Error("HTML inválido ou muito curto para geração de PDF");
  }

  let browser = null;

  try {
    // 2. Inicialização do navegador com argumentos estáveis
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Evita falhas por limite de memória compartilhada em containers
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check"
      ],
    });

    // 3. Criação da aba e definição do conteúdo HTML
    const page = await browser.newPage();
    
    // Define um tempo limite de 30s para evitar travamento em pendências de rede
    await page.setContent(html, { 
      waitUntil: "networkidle0",
      timeout: 30000 
    });

    // 4. Geração do buffer do PDF
    const pdf = await page.pdf({
      format: "A4",
      landscape: true, // Orientação paisagem para acomodar Segunda a Sábado perfeitamente
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>", // Mantém o topo limpo
      footerTemplate: `
        <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; text-align: center; color: #666;">
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `,
      margin: { 
        top: "12mm", 
        bottom: "16mm", 
        left: "10mm", 
        right: "10mm" 
      },
    });

    return pdf;

  } catch (error) {
    console.error("Erro crítico durante a geração do PDF no Puppeteer:", error);
    throw error;
  } finally {
    // 5. Encerramento seguro do processo do navegador
    if (browser !== null) {
      await browser.close();
    }
  }
};