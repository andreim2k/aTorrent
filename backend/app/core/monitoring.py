"""Performance monitoring and metrics collection."""

import time
import threading
from typing import Dict, Any, Optional, Callable
from functools import wraps
import logging
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class Metric:
    """Performance metric."""
    name: str
    value: float
    timestamp: datetime
    tags: Dict[str, str] = None


class PerformanceMonitor:
    """Performance monitoring system."""
    
    def __init__(self, max_metrics: int = 10000):
        self.max_metrics = max_metrics
        self.metrics: deque = deque(maxlen=max_metrics)
        self.counters: Dict[str, int] = defaultdict(int)
        self.timers: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.lock = threading.Lock()
    
    def record_metric(self, name: str, value: float, tags: Dict[str, str] = None):
        """Record a metric."""
        with self.lock:
            metric = Metric(
                name=name,
                value=value,
                timestamp=datetime.now(),
                tags=tags or {}
            )
            self.metrics.append(metric)
    
    def increment_counter(self, name: str, value: int = 1):
        """Increment a counter."""
        with self.lock:
            self.counters[name] += value
    
    def record_timing(self, name: str, duration: float):
        """Record a timing measurement."""
        with self.lock:
            self.timers[name].append(duration)
    
    def get_metrics(self, name: Optional[str] = None, 
                   since: Optional[datetime] = None) -> list:
        """Get metrics filtered by name and time."""
        with self.lock:
            filtered = list(self.metrics)
            
            if name:
                filtered = [m for m in filtered if m.name == name]
            
            if since:
                filtered = [m for m in filtered if m.timestamp >= since]
            
            return filtered
    
    def get_counter(self, name: str) -> int:
        """Get counter value."""
        with self.lock:
            return self.counters.get(name, 0)
    
    def get_timing_stats(self, name: str) -> Dict[str, float]:
        """Get timing statistics for a metric."""
        with self.lock:
            timings = list(self.timers.get(name, []))
            
            if not timings:
                return {}
            
            return {
                "count": len(timings),
                "min": min(timings),
                "max": max(timings),
                "avg": sum(timings) / len(timings),
                "p50": sorted(timings)[len(timings) // 2],
                "p95": sorted(timings)[int(len(timings) * 0.95)],
                "p99": sorted(timings)[int(len(timings) * 0.99)]
            }
    
    def get_summary(self) -> Dict[str, Any]:
        """Get monitoring summary."""
        with self.lock:
            now = datetime.now()
            last_hour = now - timedelta(hours=1)
            
            recent_metrics = [m for m in self.metrics if m.timestamp >= last_hour]
            
            # Group metrics by name
            metric_counts = defaultdict(int)
            for metric in recent_metrics:
                metric_counts[metric.name] += 1
            
            return {
                "total_metrics": len(self.metrics),
                "recent_metrics": len(recent_metrics),
                "counters": dict(self.counters),
                "metric_counts": dict(metric_counts),
                "timing_stats": {
                    name: self.get_timing_stats(name) 
                    for name in self.timers.keys()
                }
            }


# Global monitor instance
monitor = PerformanceMonitor()


def monitor_performance(name: str, tags: Dict[str, str] = None):
    """Decorator to monitor function performance."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                monitor.increment_counter(f"{name}_success")
                return result
            except Exception as e:
                monitor.increment_counter(f"{name}_error")
                raise
            finally:
                duration = time.time() - start_time
                monitor.record_timing(name, duration)
                monitor.record_metric(f"{name}_duration", duration, tags)
        
        return wrapper
    return decorator


def monitor_api_endpoint(endpoint_name: str):
    """Decorator specifically for API endpoints."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                monitor.increment_counter(f"api_{endpoint_name}_success")
                return result
            except Exception as e:
                monitor.increment_counter(f"api_{endpoint_name}_error")
                raise
            finally:
                duration = time.time() - start_time
                monitor.record_timing(f"api_{endpoint_name}", duration)
                monitor.record_metric(f"api_{endpoint_name}_duration", duration)
        
        return wrapper
    return decorator


def monitor_database_operation(operation_name: str):
    """Decorator for database operations."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                monitor.increment_counter(f"db_{operation_name}_success")
                return result
            except Exception as e:
                monitor.increment_counter(f"db_{operation_name}_error")
                raise
            finally:
                duration = time.time() - start_time
                monitor.record_timing(f"db_{operation_name}", duration)
                monitor.record_metric(f"db_{operation_name}_duration", duration)
        
        return wrapper
    return decorator

