import { FileQuestion, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { nome: string; onDownload: () => void }

export function UnsupportedViewer({ nome, onDownload }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-muted/40 rounded-md">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="font-display font-semibold text-foreground mb-1">Pré-visualização não disponível</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        O formato de <strong>{nome}</strong> não pode ser exibido diretamente. Faça o download para abrir no seu computador.
      </p>
      <Button onClick={onDownload}>
        <Download className="h-4 w-4 mr-2" /> Baixar arquivo
      </Button>
    </div>
  );
}
