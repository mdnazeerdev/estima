# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# Stage 2: Build the Node.js TypeScript backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend
COPY backend/ ./backend/
RUN npm run build --prefix backend

# Stage 3: Setup the production runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy workspace package definitions
COPY package*.json ./
RUN npm ci --only=production

# Copy backend configurations and install production dependencies
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --only=production

# Copy compiled backend code and compiled frontend assets
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["npm", "run", "start"]
