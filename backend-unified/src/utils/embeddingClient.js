/**
 * Embedding Service Client
 * Connects to Python embedding service for vector generation and reranking
 */
import axios from 'axios';
import NodeCache from 'node-cache';
import { logger } from './logger.js';

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8001';

// In-memory cache (fallback if Redis fails in embedding service)
const memoryCache = new NodeCache({ 
  stdTTL: 3600,  // 1 hour
  checkperiod: 120,  // Check for expired keys every 2 minutes
  maxKeys: 10000  // Store max 10k embeddings
});

class EmbeddingClient {
  constructor() {
    this.baseURL = EMBEDDING_SERVICE_URL;
    this.healthy = false;
    this.checkHealth();
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      this.healthy = response.data.status === 'healthy';
      
      if (this.healthy) {
        logger.info('✅ Embedding service connected', { url: this.baseURL });
      }
    } catch (error) {
      this.healthy = false;
      logger.warn('⚠️ Embedding service not available', { 
        url: this.baseURL,
        error: error.message 
      });
    }
    
    return this.healthy;
  }

  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input');
      }

      // Check memory cache first
      const cacheKey = `emb:${text.substring(0, 100)}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for embedding');
        return cached;
      }

      // Call embedding service
      const response = await axios.post(`${this.baseURL}/embed`, {
        text: text.trim().substring(0, 8000)  // Limit to 8000 chars
      }, {
        timeout: 10000,  // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const embedding = response.data.embedding;
      
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding response');
      }

      // Cache it
      memoryCache.set(cacheKey, embedding);
      
      logger.debug('Embedding generated', { 
        dimensions: embedding.length,
        cached: response.data.cached,
        duration_ms: response.data.duration_ms
      });

      return embedding;
      
    } catch (error) {
      logger.error('Embedding generation failed', { 
        error: error.message,
        url: this.baseURL
      });
      
      // If service is down, return null (query will fallback to keyword-only search)
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.healthy = false;
        logger.warn('Embedding service unavailable, falling back to keyword search');
        return null;
      }
      
      throw new Error('Failed to generate embedding: ' + error.message);
    }
  }

  async generateBatchEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('Invalid texts input');
      }

      // Filter and validate texts
      const validTexts = texts
        .filter(t => t && typeof t === 'string' && t.trim().length > 0)
        .map(t => t.trim().substring(0, 8000));

      if (validTexts.length === 0) {
        return [];
      }

      const response = await axios.post(`${this.baseURL}/embed/batch`, {
        texts: validTexts
      }, {
        timeout: 30000,  // 30 second timeout for batch
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const embeddings = response.data.embeddings;
      
      logger.info('Batch embeddings generated', {
        count: embeddings.length,
        dimensions: response.data.dimension,
        duration_ms: response.data.duration_ms,
        cached_count: response.data.cached_count
      });

      return embeddings;
      
    } catch (error) {
      logger.error('Batch embedding failed', { 
        error: error.message,
        count: texts.length
      });
      
      // Fallback: try individual embeddings
      if (texts.length <= 5) {
        logger.info('Falling back to individual embeddings');
        const embeddings = [];
        for (const text of texts) {
          try {
            const emb = await this.generateEmbedding(text);
            embeddings.push(emb);
          } catch {
            embeddings.push(null);
          }
        }
        return embeddings;
      }
      
      throw new Error('Failed to generate batch embeddings: ' + error.message);
    }
  }

  async rerank(query, documents, topK = 10) {
    try {
      if (!query || !Array.isArray(documents) || documents.length === 0) {
        return documents.map((doc, idx) => ({
          index: idx,
          score: 1.0,
          document: doc
        }));
      }

      const response = await axios.post(`${this.baseURL}/rerank`, {
        query,
        documents,
        top_k: topK
      }, {
        timeout: 30000,  // 30 second timeout (increased)
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.debug('Reranking complete', {
        total: documents.length,
        returned: response.data.results.length,
        duration_ms: response.data.duration_ms
      });

      return response.data.results;
      
    } catch (error) {
      logger.warn('Reranking failed, using original order', { 
        error: error.message 
      });
      
      // Fallback: return original order
      return documents.slice(0, topK).map((doc, idx) => ({
        index: idx,
        score: 1.0,
        document: doc
      }));
    }
  }

  async getStats() {
    try {
      const response = await axios.get(`${this.baseURL}/stats`, {
        timeout: 5000
      });
      return response.data;
    } catch {
      return null;
    }
  }

  isHealthy() {
    return this.healthy;
  }
}

// Export singleton instance
export default new EmbeddingClient();
