const puppeteer = require("puppeteer");

exports.generatePDF = async (html) => {
  // 1. Validação prévia do input
  if (!html || html.length < 100) {
    throw new Error("HTML inválido ou muito curto para geração de PDF");
  }

  // Declaramos a variável fora para que seja acessível no bloco 'finally'
  let browser = null;

  try {
    // 2. Inicialização do navegador com os argumentos otimizados para produção/Linux
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Evita falhas por limite de memória compartilhada em containers
        "--disable-gpu",
        "--single-process",        // Economiza memória RAM preciosa no servidor
        "--no-zygote"
      ],
    });

    // 3. Criação da aba e definição do conteúdo HTML
    const page = await browser.newPage();
    
    // O 'networkidle0' garante que fontes externas, imagens ou estilos carreguem completamente
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 4. Geração do buffer do PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>", // Espaço vazio necessário para manter a margem do topo limpa
      footerTemplate: `
        <div style="font-size: 10px; font-family: Arial, sans-serif; width: 100%; text-align: center; color: #666;">
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `,
      margin: { 
        top: "18mm", 
        bottom: "22mm", 
        left: "15mm", 
        right: "15mm" 
      },
    });

    // Retorna o buffer gerado com sucesso
    return pdf;

  } catch (error) {
    console.error("Erro crítico durante a geração do PDF no Puppeteer:", error);
    throw error; // Repassa o erro para o controller responder com status 500 corretamente
  } finally {
    // 5. Segurança do Servidor: Garante o fechamento do Chrome aconteça o que acontecer
    if (browser !== null) {
      await browser.close();
    }
  }
};