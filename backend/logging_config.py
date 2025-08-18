import logging
import logging.config
from pathlib import Path

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        },
        "simple": {
            "format": "%(levelname)s - %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "WARNING",  # Only show warnings and errors in console
            "formatter": "simple",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "WARNING",  # Only log warnings and errors to file
            "formatter": "default",
            "filename": "logs/atorrent.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 3,
            "encoding": "utf8"
        }
    },
    "loggers": {
        "app": {
            "level": "WARNING",
            "handlers": ["console", "file"],
            "propagate": False
        },
        "uvicorn": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False
        },
        "uvicorn.error": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False
        },
        "uvicorn.access": {
            "level": "WARNING",
            "handlers": ["file"],
            "propagate": False
        },
        "sqlalchemy": {
            "level": "WARNING",
            "handlers": ["file"],
            "propagate": False
        },
        "libtorrent": {
            "level": "WARNING",
            "handlers": ["file"],
            "propagate": False
        }
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console", "file"]
    }
}

def setup_logging():
    """Setup logging configuration"""
    logging.config.dictConfig(LOGGING_CONFIG)
