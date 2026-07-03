FROM node:20-alpine

# 1. Instala o Chromium e fontes necessárias para o Alpine renderizar textos no PDF corretamente
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# 2. Configura o Puppeteer para não baixar o Chrome padrão (economiza espaço)
# e aponta para o caminho do Chromium instalado pelo Alpine
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install --production

# Copia o resto do código
COPY . .

# Expõe a porta que o backend vai usar
EXPOSE 3000

# Comando para iniciar o backend
CMD ["node", "server.js"]