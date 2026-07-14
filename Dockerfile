FROM node:22-slim

WORKDIR /app

# Copiar package.json raiz e instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copiar backend e instalar
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --production=false

# Copiar frontend e instalar
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci --production=false

# Copiar todo o codigo
COPY . .

# Build do frontend
RUN cd frontend && npx tsc && npx vite build

# Build do backend (no-op, mas mantem consistencia)
RUN cd backend && npm run build

# Criar diretorio de dados
RUN mkdir -p /app/data

EXPOSE ${PORT:-3001}

CMD ["node", "backend/src/index.js"]
