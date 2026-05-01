import { useState } from 'react';

interface Props { url: string; nome: string }

export function ImageViewer({ url, nome }: Props) {
  const [zoom, setZoom] = useState(false);
  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center bg-muted/40 rounded-md p-4">
      <img
        src={url}
        alt={nome}
        onClick={() => setZoom(z => !z)}
        className={`cursor-zoom-${zoom ? 'out' : 'in'} ${zoom ? 'max-w-none max-h-none' : 'max-h-[80vh] max-w-full object-contain'} transition-all`}
      />
    </div>
  );
}
