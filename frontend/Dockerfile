# -------- Build Stage --------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -------- Production Stage --------
FROM nginx:alpine

# Remove config default do nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia config customizada (crie o nginx.conf na pasta frontend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia build do React
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]