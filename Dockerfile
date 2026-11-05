# ---- Build stage -----------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY frontend/ ./
RUN npm run build


# ---- Runtime stage ---------------------------------------------------------
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies (waitress is the production WSGI server)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Application code — the backend serves frontend/dist as one process
COPY backend/ ./backend/
COPY --from=build /app/dist ./frontend/dist

# Persistent state (SQLite DB + uploaded images) lives on the volume
# mounted at /app/data — data survives redeploys.
ENV DATA_DIR=/app/data \
    PORT=3001 \
    COOKIE_SECURE=1
EXPOSE 3001

WORKDIR /app/backend
CMD ["python", "app.py"]
