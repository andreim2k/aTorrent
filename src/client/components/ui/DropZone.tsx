import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/cn.js';
import { Icon } from './Icon.js';

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
        'rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 border-2 border-dashed',
        isDragActive ? 'border-accent-indigo/70 bg-accent-indigo/10' : 'border-white/[0.1] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className={cn('w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all', isDragActive ? 'bg-accent-indigo/30 text-indigo-200 scale-110' : 'bg-white/[0.06] text-white/50')}>
        <Icon name="upload" size={22} />
      </div>
      <p className="text-sm text-white/70 font-medium">{isDragActive ? 'Drop to add' : 'Drop .torrent files here'}</p>
      <p className="text-xs text-white/30 mt-1">or click to browse</p>
    </div>
  );
}
