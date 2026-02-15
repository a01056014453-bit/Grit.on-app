# ============================================================
# Audiveris 5.9.0 pre-built .deb — no source build needed
# ============================================================
FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV JAVA_TOOL_OPTIONS="-Djava.awt.headless=true -Xmx1g"

# System dependencies: Tesseract (OCR), Poppler (pdf2image), wget
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libfreetype6 \
    fontconfig \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download Audiveris 5.9.0 .deb, install dependencies, then extract
# without running post-install scripts (xdg-desktop-menu fails in headless)
RUN wget -q https://github.com/Audiveris/audiveris/releases/download/5.9.0/Audiveris-5.9.0-ubuntu22.04-x86_64.deb \
       -O /tmp/audiveris.deb \
    && apt-get update \
    && dpkg --unpack /tmp/audiveris.deb || true \
    && apt-get install -y --no-install-recommends -f \
    && rm -f /var/lib/dpkg/info/audiveris.postinst \
    && dpkg --configure audiveris || true \
    && rm /tmp/audiveris.deb \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/audiveris/bin:${PATH}"

# Python app
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

EXPOSE 8080

CMD ["sh", "-c", "echo Starting on port $PORT && gunicorn -b 0.0.0.0:${PORT:-8080} -t 660 -w 1 --access-logfile - --error-logfile - server:app"]
