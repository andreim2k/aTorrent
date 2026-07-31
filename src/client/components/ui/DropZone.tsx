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
      const rescued = fileRejections
        .filter((rejection) => rejection.file.name.toLowerCase().endsWith('.torrent'))
        .map((rejection) => rejection.file);
      const allTorrents = [...acceptedFiles, ...rescued];
      if (allTorrents.length > 0) onFileDrop(allTorrents);
    },
  });

  const receiving = isDragActive && !disabled;

  return (
    <div
      {...getRootProps()}
      className={cn('holo-drop', receiving && 'is-receiving', disabled && 'is-disabled', className)}
    >
      <input {...getInputProps()} />
      <div className="holo-drop__mark" aria-hidden="true">{receiving ? '⇩' : '⬡'}</div>
      <p style={{ fontSize: '.8125rem', fontWeight: 500 }}>
        {disabled ? 'Uploading…' : receiving ? 'Release to queue' : 'Drop .torrent files'}
      </p>
      <p className="holo-label" style={{ marginTop: 6 }}>
        {disabled ? 'transferring' : 'or click to browse'}
      </p>
    </div>
  );
}
