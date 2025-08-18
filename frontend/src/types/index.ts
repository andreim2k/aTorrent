// Authentication types (single-user system)
export interface Login {
  password: string;
}

// Authentication types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Torrent types
export interface Torrent {
  id: number;
  info_hash: string;
  name: string;
  status: TorrentStatus;
  progress: number;
  total_size: number;
  downloaded: number;
  uploaded: number;
  download_speed: number;
  upload_speed: number;
  peers_connected: number;
  peers_total: number;
  seeds_connected: number;
  seeds_total: number;
  ratio: number;
  availability: number;
  eta: number;
  time_active: number;
  download_path?: string;
  priority: number;
  sequential_download: boolean;
  file_count: number;
  files_info?: FileInfo[];
  label?: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  started_at?: string;
}

export interface TorrentCreate {
  torrent_file: string;
  auto_start: boolean;
  sequential_download: boolean;
  priority: number;
}

export interface TorrentUpdate {
  priority?: number;
  sequential_download?: boolean;
  label?: string;
  category?: string;
  download_path?: string;
}

export type TorrentStatus = 
  | 'downloading' 
  | 'seeding' 
  | 'paused' 
  | 'error' 
  | 'completed' 
  | 'checking';

export interface FileInfo {
  name: string;
  size: number;
  progress: number;
  priority: number;
}


// Settings types
export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  timezone: string;
  default_download_path?: string;
  max_download_speed: number;
  max_upload_speed: number;
  max_active_downloads: number;
  auto_start_downloads: boolean;
  enable_notifications: boolean;
  notify_on_download_complete: boolean;
  enable_dht: boolean;
  connection_port: number;
  use_random_port: boolean;
}

// Statistics types
export interface TorrentStats {
  total_torrents: number;
  active_torrents: number;
  downloading: number;
  seeding: number;
  paused: number;
  completed: number;
  total_download_speed: number;
  total_upload_speed: number;
  total_downloaded: number;
  total_uploaded: number;
}

export interface SessionStats {
  download_rate: number;
  upload_rate: number;
  total_download: number;
  total_upload: number;
  num_peers: number;
  dht_nodes: number;
}

// WebSocket types
export interface WebSocketMessage {
  type: 'torrent_update' | 'ping' | 'pong' | 'error' | 'notification';
  data?: any;
  timestamp?: string;
}

// UI types
export interface NotificationOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface DialogState {
  open: boolean;
  data?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

// Form types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationError {
  errors: FormError[];
}
