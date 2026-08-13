FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent

FROM deps AS builder
COPY . .
RUN npm run build --silent

# Serve the static build with a small static server
FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve --silent
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
