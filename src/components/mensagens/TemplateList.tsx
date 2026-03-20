import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, MessageSquare } from 'lucide-react';

interface TemplateListProps {
  templates: any[];
  isLoading: boolean;
  onEdit: (template: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, ativo: boolean) => void;
  onTest: (template: any) => void;
}

export function TemplateList({ templates, isLoading, onEdit, onDelete, onToggle, onTest }: TemplateListProps) {
  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground font-medium">Nenhum template criado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((t: any) => (
        <Card key={t.id} className={`shadow-sm transition-opacity ${!t.ativo ? 'opacity-60' : ''}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">{t.nome}</span>
                <Badge variant="outline" className="text-xs">{t.canal === 'whatsapp' ? 'WhatsApp' : 'Email'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{t.corpo}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={t.ativo} onCheckedChange={(v) => onToggle(t.id, v)} />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onTest(t)} title="Testar">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(t)} title="Editar">
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(t.id)} title="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
