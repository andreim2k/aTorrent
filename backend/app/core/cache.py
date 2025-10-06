"""Simple in-memory cache implementation."""

import time
from typing import Any, Dict, Optional, Union
from threading import Lock
import logging

logger = logging.getLogger(__name__)


class CacheItem:
    """Cache item with expiration."""
    
    def __init__(self, value: Any, ttl: int = 300):
        self.value = value
        self.expires_at = time.time() + ttl
        self.created_at = time.time()
    
    def is_expired(self) -> bool:
        """Check if item has expired."""
        return time.time() > self.expires_at
    
    def age(self) -> float:
        """Get age of item in seconds."""
        return time.time() - self.created_at


class SimpleCache:
    """Thread-safe in-memory cache."""
    
    def __init__(self, default_ttl: int = 300, max_size: int = 1000):
        self.default_ttl = default_ttl
        self.max_size = max_size
        self._cache: Dict[str, CacheItem] = {}
        self._lock = Lock()
        self._hits = 0
        self._misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        with self._lock:
            if key in self._cache:
                item = self._cache[key]
                if not item.is_expired():
                    self._hits += 1
                    return item.value
                else:
                    # Remove expired item
                    del self._cache[key]
            
            self._misses += 1
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache."""
        if ttl is None:
            ttl = self.default_ttl
        
        with self._lock:
            # Remove oldest items if cache is full
            if len(self._cache) >= self.max_size:
                self._evict_oldest()
            
            self._cache[key] = CacheItem(value, ttl)
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
    
    def _evict_oldest(self) -> None:
        """Evict oldest cache entry."""
        if not self._cache:
            return
        
        oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k].created_at)
        del self._cache[oldest_key]
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count."""
        with self._lock:
            expired_keys = [
                key for key, item in self._cache.items() 
                if item.is_expired()
            ]
            
            for key in expired_keys:
                del self._cache[key]
            
            return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = self._hits / total_requests if total_requests > 0 else 0
            
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": hit_rate,
                "total_requests": total_requests
            }


# Global cache instances
torrent_cache = SimpleCache(default_ttl=60, max_size=500)  # 1 minute TTL for torrent data
session_cache = SimpleCache(default_ttl=300, max_size=100)  # 5 minutes TTL for session data
stats_cache = SimpleCache(default_ttl=30, max_size=50)       # 30 seconds TTL for stats


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments."""
    key_parts = []
    
    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        else:
            key_parts.append(str(hash(str(arg))))
    
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}:{v}")
    
    return ":".join(key_parts)


def cached(ttl: int = 300, cache_instance: SimpleCache = None):
    """Decorator for caching function results."""
    if cache_instance is None:
        cache_instance = torrent_cache
    
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key
            key = cache_key(func.__name__, *args, **kwargs)
            
            # Try to get from cache
            result = cache_instance.get(key)
            if result is not None:
                logger.debug(f"Cache hit for {func.__name__}: {key}")
                return result
            
            # Execute function and cache result
            logger.debug(f"Cache miss for {func.__name__}: {key}")
            result = func(*args, **kwargs)
            cache_instance.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator

