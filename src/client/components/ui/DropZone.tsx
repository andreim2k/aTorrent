import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/cn.js';

interface Props {
  onFileDrop: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

export function DropZone({ onFileDrop, className, disabled = false }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/x-bittorrent': ['.torrent'], 'application/octet-stream': ['.torrent'] },
    multiple: true,
    disabled,
    validator: (file) =>
      file.name.toLowerCase().endsWith('.torrent')
        ? null
        : { code: 'file-invalid-type', message: 'Only .torrent files are allowed' },
    onDrop: (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        // Non-.torrent files are rejected; .torrent files should now always be accepted
        // via the validator regardless of what MIME the OS reports on drag.
        console.debug(
          '[DropZone] Rejected files:',
          fileRejections.map((r) => r.file.name)
        );
      }
      if (acceptedFiles.length > 0) onFileDrop(acceptedFiles);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'glass rounded-xl p-8 text-center transition-all duration-200',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        isDragActive && !disabled && 'glass-active border-accent-indigo/40',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="text-white/40 text-4xl mb-3">
        {isDragActive && !disabled ? '📥' : '📁'}
      </div>
      <p className="text-white/60 text-sm">
        {disabled
          ? 'Uploading...'
          : isDragActive
          ? 'Drop .torrent files here'
          : 'Drag & drop .torrent files, or click to browse'}
      </p>
    </div>
  );
}
