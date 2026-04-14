# Build the React SPA and place the static output in a scratch image
# so it can be COPYed into the microcontroller-api container.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Build outputs to dist/ (vite default); we redirect this in vite.config.js
# to ../microcontroller-api/static, but inside Docker we keep it at dist/
RUN npm run build -- --outDir dist

# Final stage — nginx serves the SPA
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
# SPA routing: all paths fall back to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
