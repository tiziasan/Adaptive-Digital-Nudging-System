# === STAGE 1: Build ===
FROM node:18-alpine as builder
WORKDIR /app

# Only copy necessary files to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

COPY . .

# Build your frontend
RUN npm run build


# === STAGE 2: Production image ===
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server and frontend build output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/utils/server.js ./server.js

# Expose port and run
EXPOSE 5000
CMD ["node", "server.js"]
