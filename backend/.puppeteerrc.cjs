const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Salva o cache na raiz do projeto, FORA da node_modules
  cacheDirectory: join(__dirname, '.puppeteer_cache'),
};