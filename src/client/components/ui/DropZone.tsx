import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/cn.js';

interface Props {
  onFileDrop: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

export function DropZone({ onFileDrop, className, disabled = false }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/x-bittorrent': ['.torrent'],
      'application/octet-stream': ['.torrent'],
    },
    multiple: true,
    disabled,
    validator: (file) => file.name.toLowerCase().endsWith('.torrent') ? null : { code: 'file-invalid-type', message: 'Only .torrent files are allowed' },
    onDrop: (acceptedFiles, fileRejections) => {
      const rescued = fileRejections.filter((rejection) => rejection.file.name.toLowerCase().endsWith('.torrent')).map((rejection) => rejection.file);
      const allTorrents = [...acceptedFiles, ...rescued];
      if (allTorrents.length > 0) onFileDrop(allTorrents);
    },
  });

  const receiving = isDragActive && !disabled;

  return (
    <div {...getRootProps()} className={cn('tui-dropzone glass p-8 text-center transition-all duration-200', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', receiving && 'glass-active border-accent-indigo/40', className)}>
      <input {...getInputProps()} />
      <div className={`tui-drop-icon ${receiving ? 'receiving' : ''}`}>
        <span>{receiving ? '[ RX ]' : '[ FILE ]'}</span>
        <code>{receiving ? '≫≫≫' : '└── .torrent'}</code>
      </div>
      <p className="text-white/60 text-sm">
        {disabled ? 'Uploading...' : receiving ? 'Release to enqueue torrent' : 'Drop .torrent files here or tap to browse'}
      </p>
    </div>
  );
}
