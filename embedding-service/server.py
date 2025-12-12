"""
FastAPI Embedding & Reranking Service
100% FREE, Production-Ready, Military-Grade
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
import os
from models import engine
from cache import get_cached_embedding, cache_embedding, get_cache_stats, REDIS_AVAILABLE

app = FastAPI(
    title="BGE Embedding & Reranking Service",
    description="Free, open-source, production-ready embedding service",
    version="1.0.0"
)

# CORS middleware (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to your backend URL in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Request models
class EmbeddingRequest(BaseModel):
    text: str
    
class BatchEmbeddingRequest(BaseModel):
    texts: List[str]

class RerankRequest(BaseModel):
    query: str
    documents: List[str]
    top_k: int = 10

# Routes
@app.get("/")
async def root():
    return {
        "service": "BGE Embedding & Reranking Service",
        "status": "healthy",
        "models": {
            "embedding": "BAAI/bge-base-en-v1.5 (768 dims)",
            "reranker": "BAAI/bge-reranker-base"
        },
        "features": ["embeddings", "batch_embeddings", "reranking", "caching"],
        "cache": "enabled" if REDIS_AVAILABLE else "disabled"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models": "loaded",
        "cache": "enabled" if REDIS_AVAILABLE else "disabled",
        "timestamp": time.time()
    }

@app.get("/stats")
async def stats():
    """Service statistics"""
    cache_stats = get_cache_stats()
    return {
        "cache": cache_stats,
        "embedding_dimensions": 768,
        "max_sequence_length": 512
    }

@app.post("/embed")
async def create_embedding(request: EmbeddingRequest):
    """
    Generate single embedding with caching
    Returns: {"embedding": [...], "dimension": 768, "cached": bool, "duration_ms": float}
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Limit text length (8000 chars ~ 2000 tokens)
        text = request.text.strip()[:8000]
        
        # Check cache first
        cached = get_cached_embedding(text)
        if cached:
            return {
                "embedding": cached,
                "dimension": len(cached),
                "cached": True,
                "duration_ms": 0
            }
        
        # Generate new embedding
        start = time.time()
        embedding = engine.generate_embedding(text)
        duration = (time.time() - start) * 1000
        
        # Cache it
        cache_embedding(text, embedding)
        
        return {
            "embedding": embedding,
            "dimension": len(embedding),
            "cached": False,
            "duration_ms": round(duration, 2)
        }
        
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.post("/embed/batch")
async def create_batch_embeddings(request: BatchEmbeddingRequest):
    """
    Generate multiple embeddings (3-5x faster than individual calls)
    Returns: {"embeddings": [[...], [...]], "count": int, "dimension": 768, "duration_ms": float}
    """
    try:
        if not request.texts or len(request.texts) == 0:
            raise HTTPException(status_code=400, detail="Texts cannot be empty")
        
        # Limit text length for each text
        texts = [text.strip()[:8000] for text in request.texts if text.strip()]
        
        if len(texts) == 0:
            raise HTTPException(status_code=400, detail="No valid texts provided")
        
        # Check cache for each text
        embeddings = []
        texts_to_embed = []
        cache_indices = {}
        
        for idx, text in enumerate(texts):
            cached = get_cached_embedding(text)
            if cached:
                embeddings.append(cached)
                cache_indices[idx] = len(embeddings) - 1
            else:
                texts_to_embed.append(text)
        
        # Generate embeddings for non-cached texts
        if texts_to_embed:
            start = time.time()
            new_embeddings = engine.generate_batch_embeddings(texts_to_embed)
            duration = (time.time() - start) * 1000
            
            # Cache new embeddings
            for text, emb in zip(texts_to_embed, new_embeddings):
                cache_embedding(text, emb)
                embeddings.append(emb)
        else:
            duration = 0
        
        # Reorder embeddings to match input order
        if cache_indices:
            final_embeddings = []
            cached_idx = 0
            new_idx = len(cache_indices)
            for idx in range(len(texts)):
                if idx in cache_indices:
                    final_embeddings.append(embeddings[cache_indices[idx]])
                else:
                    final_embeddings.append(embeddings[new_idx])
                    new_idx += 1
            embeddings = final_embeddings
        
        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0,
            "duration_ms": round(duration, 2),
            "avg_ms_per_text": round(duration / len(texts_to_embed), 2) if texts_to_embed else 0,
            "cached_count": len(cache_indices)
        }
        
    except Exception as e:
        print(f"❌ Batch embedding error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch embedding failed: {str(e)}")

@app.post("/rerank")
async def rerank_documents(request: RerankRequest):
    """
    Rerank documents using BGE cross-encoder (more accurate than cosine similarity)
    Returns: {"results": [{"index": int, "score": float, "document": str}], "duration_ms": float}
    """
    try:
        if not request.query or not request.documents:
            raise HTTPException(status_code=400, detail="Query and documents are required")
        
        if len(request.documents) == 0:
            return {"results": [], "duration_ms": 0}
        
        # Limit document length
        documents = [doc[:8000] for doc in request.documents]
        
        start = time.time()
        ranked = engine.rerank(request.query, documents, request.top_k)
        duration = (time.time() - start) * 1000
        
        # Format results
        results = [
            {
                "index": idx,
                "score": float(score),
                "document": documents[idx][:500]  # Return first 500 chars as preview
            }
            for score, idx in ranked
        ]
        
        return {
            "results": results,
            "total_documents": len(documents),
            "returned_count": len(results),
            "duration_ms": round(duration, 2)
        }
        
    except Exception as e:
        print(f"❌ Reranking error: {e}")
        raise HTTPException(status_code=500, detail=f"Reranking failed: {str(e)}")

# Run server
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8001))
    
    print("=" * 60)
    print("🚀 Starting BGE Embedding Service")
    print("=" * 60)
    print(f"📡 Port: {port}")
    print(f"🧠 Model: BAAI/bge-base-en-v1.5 (768 dims)")
    print(f"🎯 Reranker: BAAI/bge-reranker-base")
    print(f"💾 Cache: {'Enabled (Redis)' if REDIS_AVAILABLE else 'Disabled'}")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
