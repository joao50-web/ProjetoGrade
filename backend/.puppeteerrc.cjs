const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Altera o diretório de cache para dentro da pasta do projeto
  // Isso garante que o build da hospedagem inclua o Chrome no pacote final
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};