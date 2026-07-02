const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Salva o Chrome dentro da node_modules para o Railway não deletar
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
};