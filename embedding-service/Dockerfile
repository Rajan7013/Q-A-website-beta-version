FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models during build (faster startup in production)
RUN python -c "from sentence_transformers import SentenceTransformer, CrossEncoder; \
    print('Downloading BGE models...'); \
    SentenceTransformer('BAAI/bge-base-en-v1.5'); \
    CrossEncoder('BAAI/bge-reranker-base'); \
    print('Models downloaded!')"

# Copy application code
COPY . .

# Create a non-root user (Hugging Face security requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose port (Hugging Face default)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:7860/health')"

# Run server
CMD ["python", "server.py"]
