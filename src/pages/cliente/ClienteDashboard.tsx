import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Upload, ClipboardList } from 'lucide-react';

export default function ClienteDashboard() {
  const { profile } = useAuth();

  return (
    <ClienteLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Olá, {profile.nome || 'Cliente'}!
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe o status da sua declaração de IR</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <FileText className="h-10 w-10 text-accent mb-3" />
              <p className="font-medium">Declaração</p>
              <p className="text-sm text-muted-foreground mt-1">Status em breve</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <ClipboardList className="h-10 w-10 text-primary mb-3" />
              <p className="font-medium">Formulário IR</p>
              <p className="text-sm text-muted-foreground mt-1">Preencha seus dados</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <Upload className="h-10 w-10 text-success mb-3" />
              <p className="font-medium">Documentos</p>
              <p className="text-sm text-muted-foreground mt-1">Envie seus documentos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClienteLayout>
  );
}
