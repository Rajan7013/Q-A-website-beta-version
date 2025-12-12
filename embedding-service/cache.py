"""
Redis caching for embeddings (80% faster on repeated queries)
"""
import redis
import hashlib
import json
import os

# Redis connection (with fallback for local development)
try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        password=os.getenv('REDIS_PASSWORD', None),
        decode_responses=False,  # Binary data
        socket_connect_timeout=2,
        socket_timeout=2
    )
    # Test connection
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis connected")
except Exception as e:
    print(f"⚠️ Redis not available: {e}")
    print("💡 Running without cache (will be slower)")
    REDIS_AVAILABLE = False
    redis_client = None

def get_cache_key(text: str) -> str:
    """Generate cache key from text hash (SHA-256)"""
    return f"emb:{hashlib.sha256(text.encode('utf-8')).hexdigest()}"

def get_cached_embedding(text: str):
    """
    Get embedding from cache
    Returns: embedding list or None
    """
    if not REDIS_AVAILABLE:
        return None
    
    try:
        key = get_cache_key(text)
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"Cache read error: {e}")
    
    return None

def cache_embedding(text: str, embedding: list):
    """
    Store embedding in cache
    TTL: 24 hours (embeddings don't change)
    """
    if not REDIS_AVAILABLE:
        return
    
    try:
        key = get_cache_key(text)
        redis_client.setex(
            key,
            86400,  # 24 hours
            json.dumps(embedding)
        )
    except Exception as e:
        print(f"Cache write error: {e}")

def get_cache_stats():
    """Get cache statistics"""
    if not REDIS_AVAILABLE:
        return {"available": False}
    
    try:
        info = redis_client.info('stats')
        return {
            "available": True,
            "total_keys": redis_client.dbsize(),
            "hits": info.get('keyspace_hits', 0),
            "misses": info.get('keyspace_misses', 0),
            "hit_rate": round(info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0), 1) * 100, 2)
        }
    except:
        return {"available": False}
