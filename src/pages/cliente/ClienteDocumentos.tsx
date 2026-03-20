import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export default function ClienteDocumentos() {
  return (
    <ClienteLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Documentos</h1>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Upload className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Checklist de documentos em breve</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Upload de documentos será implementado aqui</p>
          </CardContent>
        </Card>
      </div>
    </ClienteLayout>
  );
}
