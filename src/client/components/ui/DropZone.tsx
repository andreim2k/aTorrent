import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/cn.js';

interface Props {
  onFileDrop: (files: File[]) => void;
  className?: string;
}

export function DropZone({ onFileDrop, className }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/x-bittorrent': ['.torrent'], 'application/octet-stream': ['.torrent'] },
    multiple: true,
    onDrop: (files) => {
      if (files.length > 0) onFileDrop(files);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'glass rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
        isDragActive && 'glass-active border-accent-indigo/40',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="text-white/40 text-4xl mb-3">
        {isDragActive ? '📥' : '📁'}
      </div>
      <p className="text-white/60 text-sm">
        {isDragActive ? 'Drop .torrent files here' : 'Drag & drop .torrent files, or click to browse'}
      </p>
    </div>
  );
}
