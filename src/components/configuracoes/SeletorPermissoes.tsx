import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface SeletorPermissoesProps {
  permissoesSelecionadas: string[];
  onChange: (permissoes: string[]) => void;
}

export function SeletorPermissoes({ permissoesSelecionadas, onChange }: SeletorPermissoesProps) {
  const { data: permissoes, isLoading } = useQuery({
    queryKey: ['todas-permissoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissoes')
        .select('*')
        .order('categoria', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const handleToggle = (id: string) => {
    if (permissoesSelecionadas.includes(id)) {
      onChange(permissoesSelecionadas.filter(p => p !== id));
    } else {
      onChange([...permissoesSelecionadas, id]);
    }
  };

  // Group by category for better UX
  type Permissao = { id: string; categoria: string | null; descricao: string | null; nome?: string | null };
  const categorias = (permissoes as Permissao[] | undefined)?.reduce((acc: Record<string, Permissao[]>, p) => {
    const cat = p.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const labelsMap: Record<string, string> = {
    'clientes': 'Clientes',
    'declaracoes': 'Declarações',
    'cobrancas': 'Cobranças',
    'configuracoes': 'Configurações',
    'Outros': 'Outros'
  };

  return (
    <div className="space-y-6">
      {Object.keys(categorias || {}).map(cat => (
        <div key={cat} className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {labelsMap[cat] || cat}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {categorias[cat].map((p) => (
              <div key={p.id} className="flex items-start space-x-3">
                <Checkbox 
                  id={`perm-${p.id}`} 
                  checked={permissoesSelecionadas.includes(p.id)}
                  onCheckedChange={() => handleToggle(p.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor={`perm-${p.id}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {p.descricao}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
