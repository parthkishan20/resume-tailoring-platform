# Dockerfile

# ── Stage 1: Build Next.js static export ────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci --quiet
COPY frontend/ ./
RUN npm run build


# ── Stage 2: Python runtime ──────────────────────────────────────────────────
FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy backend source and lockfile
COPY backend/ ./backend/

# Install Python dependencies (rendercv pulls in typst automatically — no texlive needed)
WORKDIR /app/backend
RUN uv sync --frozen --no-dev

# Copy frontend static export into backend/static/
COPY --from=frontend-builder /build/frontend/out ./static/

# Runtime directories for volumes
RUN mkdir -p /app/db /app/pdfs

WORKDIR /app/backend

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

CMD ["uv", "run", "--project", "/app/backend", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "1"]
