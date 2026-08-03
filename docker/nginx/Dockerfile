FROM node:22-alpine AS frontend
WORKDIR /app
COPY React-Rose/package*.json ./
RUN npm ci
COPY React-Rose/ ./
ARG VITE_API_BASE=https://api.rose-academy.com/api
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/ssl/origin.crt /etc/nginx/ssl/origin.crt
COPY nginx/ssl/origin.key /etc/nginx/ssl/origin.key
COPY --from=frontend /app/dist /var/www/frontend
RUN chmod 600 /etc/nginx/ssl/origin.key
