import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Paper,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Close,
  Folder,
  InsertDriveFile,
  Info,
  Schedule,
  Storage,
  Link as LinkIcon,
} from '@mui/icons-material';
import { formatBytes } from '@/utils/formatters';

interface TorrentFile {
  name: string;
  path: string;
  length: number;
}

interface TorrentInfo {
  name: string;
  files?: TorrentFile[];
  length?: number;
  pieceLength?: number;
  pieces?: Buffer;
  announce?: string[];
  comment?: string;
  createdBy?: string;
  creationDate?: number;
  private?: boolean;
  infoHash?: string;
}

interface TorrentPreviewProps {
  open: boolean;
  onClose: () => void;
  torrentInfo: TorrentInfo | null;
  fileName: string;
}

export default function TorrentPreview({ open, onClose, torrentInfo, fileName }: TorrentPreviewProps) {
  if (!torrentInfo) return null;

  const totalSize = torrentInfo.files 
    ? torrentInfo.files.reduce((acc, file) => acc + file.length, 0)
    : torrentInfo.length || 0;

  const fileCount = torrentInfo.files?.length || 1;
  const pieceCount = torrentInfo.pieces ? torrentInfo.pieces.length / 20 : 0;

  // Group files by directory
  const fileTree = torrentInfo.files ? torrentInfo.files.reduce((acc: any, file) => {
    const parts = file.path.split('/');
    if (parts.length === 1) {
      if (!acc['']) acc[''] = [];
      acc[''].push(file);
    } else {
      const dir = parts.slice(0, -1).join('/');
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file);
    }
    return acc;
  }, {}) : { '': [{ name: torrentInfo.name, length: totalSize, path: torrentInfo.name }] };

  // Sort directories and get top 10 largest files
  const sortedDirs = Object.keys(fileTree).sort();
  const allFiles = torrentInfo.files || [{ name: torrentInfo.name, length: totalSize, path: torrentInfo.name }];
  const largestFiles = [...allFiles].sort((a, b) => b.length - a.length).slice(0, 10);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <InsertDriveFile color="primary" />
            <Typography variant="h6" component="div" noWrap sx={{ maxWidth: 400 }}>
              {fileName}
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {/* Torrent Info Summary */}
        <Paper sx={{ p: 2, m: 2, bgcolor: 'background.default' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {torrentInfo.name}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Storage fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Size
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatBytes(totalSize)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Folder fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Files
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {fileCount} file{fileCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Info fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pieces
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {pieceCount} × {torrentInfo.pieceLength ? formatBytes(torrentInfo.pieceLength) : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Schedule fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {torrentInfo.creationDate 
                      ? new Date(torrentInfo.creationDate * 1000).toLocaleDateString()
                      : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {torrentInfo.comment && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Comment
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {torrentInfo.comment}
                </Typography>
              </Grid>
            )}

            {torrentInfo.createdBy && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {torrentInfo.createdBy}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Trackers */}
        {torrentInfo.announce && torrentInfo.announce.length > 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LinkIcon fontSize="small" />
              Trackers ({torrentInfo.announce.length})
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {torrentInfo.announce.slice(0, 5).map((tracker, index) => (
                <Chip
                  key={index}
                  label={new URL(tracker).hostname}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
              {torrentInfo.announce.length > 5 && (
                <Chip
                  label={`+${torrentInfo.announce.length - 5} more`}
                  size="small"
                  variant="filled"
                  color="primary"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* File List */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InsertDriveFile fontSize="small" />
            Largest Files
          </Typography>
          <List dense sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
            {largestFiles.map((file, index) => {
              const fileName = file.path.split('/').pop() || file.name;
              const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
              const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(fileExt);
              const isAudio = ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExt);
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExt);
              const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt);

              return (
                <ListItem key={index} divider={index < largestFiles.length - 1}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} component="span">
                        <Box component="span" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fileName}
                        </Box>
                        {isVideo && <Chip label="Video" size="small" color="primary" sx={{ height: 18, fontSize: '0.7rem' }} />}
                        {isAudio && <Chip label="Audio" size="small" color="secondary" sx={{ height: 18, fontSize: '0.7rem' }} />}
                        {isImage && <Chip label="Image" size="small" color="success" sx={{ height: 18, fontSize: '0.7rem' }} />}
                        {isArchive && <Chip label="Archive" size="small" color="warning" sx={{ height: 18, fontSize: '0.7rem' }} />}
                      </Box>
                    }
                    secondary={
                      <Box display="flex" alignItems="center" justifyContent="space-between" component="span">
                        <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {file.path !== fileName ? file.path.split('/').slice(0, -1).join('/') : ''}
                        </Box>
                        <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 'medium' }}>
                          {formatBytes(file.length)}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
            {allFiles.length > 10 && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" align="center">
                      And {allFiles.length - 10} more files...
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>

        {/* Info Hash */}
        {torrentInfo.infoHash && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Info Hash
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {torrentInfo.infoHash}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
