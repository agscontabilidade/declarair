import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function ClienteFormulario() {
  return (
    <ClienteLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Formulário IR</h1>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Formulário em breve</p>
            <p className="text-sm text-muted-foreground/60 mt-1">O wizard de preenchimento será implementado aqui</p>
          </CardContent>
        </Card>
      </div>
    </ClienteLayout>
  );
}
