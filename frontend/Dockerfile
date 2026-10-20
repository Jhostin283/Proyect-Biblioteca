# Contrato: Angular se compila aquí (en el CI); Nginx sirve la SPA y redirige /api
FROM node:24-alpine AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx ng build --configuration production \
 && src="$(find dist -maxdepth 2 -type d -name browser | head -n1)" \
 && if [ -z "$src" ]; then src="$(find dist -mindepth 1 -maxdepth 1 -type d | head -n1)"; fi \
 && mkdir -p /out && cp -r "$src"/. /out/

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out /usr/share/nginx/html
EXPOSE 80
