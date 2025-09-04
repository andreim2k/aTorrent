"""Application constants and configuration values."""

# Torrent service constants
TORRENT_UPDATE_INTERVAL = 0.2  # seconds
ALERT_PROCESSING_INTERVAL = 0.2  # seconds
WEBSOCKET_BROADCAST_INTERVAL = 0.2  # seconds
ERROR_RETRY_DELAY = 5  # seconds

# Session configuration
LIBTORRENT_SESSION_FLAGS = {
    "listen_interfaces": "0.0.0.0:6881",
    "enable_dht": True,
    "enable_lsd": True,
    "enable_upnp": True,
    "enable_natpmp": True,
    "auto_manage_startup": False,
}

# DHT Bootstrap nodes
DHT_BOOTSTRAP_NODES = [
    ("router.bittorrent.com", 6881),
    ("dht.transmissionbt.com", 6881),
]

# Default settings
DEFAULT_MAX_ACTIVE_DOWNLOADS = 5
DEFAULT_MAX_CONNECTIONS = 50
DEFAULT_MAX_ETA_SECONDS = 365 * 24 * 60 * 60  # 1 year

# File path constants
DOWNLOADS_PATH_KEY = "DOWNLOADS_PATH"
DATABASE_KEY = "aTorrent.db"

# Status constants
TORRENT_STATUS_PAUSED = "paused"
TORRENT_STATUS_DOWNLOADING = "downloading" 
TORRENT_STATUS_SEEDING = "seeding"
TORRENT_STATUS_COMPLETED = "completed"
TORRENT_STATUS_CHECKING = "checking"
TORRENT_STATUS_ALLOCATING = "allocating"
TORRENT_STATUS_ERROR = "error"
