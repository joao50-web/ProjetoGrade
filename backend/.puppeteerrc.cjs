const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Altera o cache para a pasta do projeto
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};