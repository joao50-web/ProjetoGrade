FROM node:20-alpine

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