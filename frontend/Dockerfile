# Development stage (Vite dev server with live reloading)
FROM node:22-slim AS dev

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]


# Build stage (using glibc node-slim for fast npm/tsc execution on WSL2)
FROM node:22-slim AS build

WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json ./

# Install dependencies using BuildKit cache to speed up npm downloads
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy remaining source code
COPY . .

# Build production bundle
RUN npm run build


# Production stage using Nginx
FROM nginx:alpine

# Remove default nginx static files and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy built app static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Add custom Nginx config for React SPA client-side routing & API proxying
RUN echo $'server {\n\
    listen 80;\n\
    listen [::]:80;\n\
    server_name _;\n\
    include /etc/nginx/mime.types;\n\
\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /api/ {\n\
        proxy_pass http://backend:8000/api/;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
