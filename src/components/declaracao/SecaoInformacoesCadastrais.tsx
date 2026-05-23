import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCPF, formatDate } from '@/lib/formatters';
import { AlertCircle, User, MapPin, Users, Key, Pencil } from 'lucide-react';
import {
  EditarDadosPessoaisDialog,
  EditarEnderecoDialog,
  EditarChavePixDialog,
  EditarDependentesDialog,
} from './editar/EditarCadastraisDialogs';

interface Props {
  declaracaoId: string;
  clienteId: string | undefined;
}

interface Dependente { nome?: string; cpf?: string; parentesco?: string; data_nascimento?: string }

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || <span className="text-muted-foreground italic font-normal">—</span>}</span>
    </div>
  );
}

export function SecaoInformacoesCadastrais({ declaracaoId, clienteId }: Props) {
  const [editing, setEditing] = useState<null | 'dados' | 'endereco' | 'pix' | 'deps'>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['info-cadastrais', declaracaoId, clienteId],
    queryFn: async () => {
      const [cliente, form, declaracao] = await Promise.all([
        clienteId
          ? supabase.from('clientes').select('nome, cpf, email, telefone, data_nascimento').eq('id', clienteId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('formulario_ir').select('*').eq('declaracao_id', declaracaoId).maybeSingle(),
        supabase.from('declaracoes').select('ano_base').eq('id', declaracaoId).maybeSingle(),
      ]);
      return { cliente: cliente.data, form: form.data, declaracao: declaracao.data };
    },
  });

  if (isLoading) return <Skeleton className="h-60 w-full" />;

  const c = data?.cliente as Record<string, unknown> | null;
  const f = data?.form as Record<string, unknown> | null;
  const anoBase = (data?.declaracao?.ano_base as number | undefined);

  if (!c && !f) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Sem informações cadastrais. O cliente ainda não preencheu o portal.</p>
        </CardContent>
      </Card>
    );
  }

  const dependentes = (Array.isArray(f?.dependentes) ? f?.dependentes : []) as Dependente[];
  const status = (f?.status_preenchimento as string) || 'nao_iniciado';
  const statusLabel = status === 'concluido' ? 'Concluído' : status === 'em_andamento' ? 'Em andamento' : 'Não iniciado';
  const statusCls = status === 'concluido' ? 'bg-emerald-100 text-emerald-800' : status === 'em_andamento' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground';

  const initial = {
    nome: c?.nome as string | undefined,
    cpf: c?.cpf as string | undefined,
    email: c?.email as string | undefined,
    telefone: c?.telefone as string | undefined,
    data_nascimento: (f?.data_nascimento || c?.data_nascimento) as string | undefined,
    estado_civil: f?.estado_civil as string | undefined,
    conjuge_nome: f?.conjuge_nome as string | undefined,
    conjuge_cpf: f?.conjuge_cpf as string | undefined,
    raca_cor: f?.raca_cor as string | undefined,
    ocupacao_principal: f?.ocupacao_principal as string | undefined,
    natureza_ocupacao: f?.natureza_ocupacao as string | undefined,
    cep: f?.cep as string | undefined,
    logradouro: f?.logradouro as string | undefined,
    numero: f?.numero as string | undefined,
    complemento: f?.complemento as string | undefined,
    bairro: f?.bairro as string | undefined,
    cidade: f?.cidade as string | undefined,
    uf: f?.uf as string | undefined,
    chave_pix_cliente: f?.chave_pix_cliente as string | undefined,
    dependentes,
  };

  const canEdit = !!clienteId;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Dados pessoais
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={statusCls}>{statusLabel}</Badge>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setEditing('dados')}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Field label="Nome" value={c?.nome as string} />
          <Field label="CPF" value={c?.cpf ? formatCPF(String(c.cpf)) : null} />
          <Field label="E-mail" value={c?.email as string} />
          <Field label="Telefone" value={c?.telefone as string} />
          <Field label="Data nascimento" value={(f?.data_nascimento || c?.data_nascimento) ? formatDate(String(f?.data_nascimento || c?.data_nascimento)) : null} />
          <Field label="Estado civil" value={f?.estado_civil as string} />
          {(f?.conjuge_nome as string) && <Field label="Cônjuge" value={f?.conjuge_nome as string} />}
          {(f?.conjuge_cpf as string) && <Field label="CPF cônjuge" value={formatCPF(String(f?.conjuge_cpf))} />}
          <Field label="Raça/cor" value={f?.raca_cor as string} />
          <Field label="Ocupação" value={f?.ocupacao_principal as string} />
          <Field label="Natureza ocupação" value={f?.natureza_ocupacao as string} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Endereço
          </CardTitle>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setEditing('endereco')}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Field label="CEP" value={f?.cep as string} />
          <Field label="Logradouro" value={f?.logradouro as string} />
          <Field label="Número" value={f?.numero as string} />
          <Field label="Complemento" value={f?.complemento as string} />
          <Field label="Bairro" value={f?.bairro as string} />
          <Field label="Cidade" value={f?.cidade as string} />
          <Field label="UF" value={f?.uf as string} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> Chave Pix (restituição)
          </CardTitle>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setEditing('pix')}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Field label="Chave Pix" value={f?.chave_pix_cliente as string} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Dependentes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{dependentes.length}</Badge>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => setEditing('deps')}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dependentes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhum dependente informado</p>
          ) : (
            <div className="space-y-2">
              {dependentes.map((d, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{d.nome || 'Sem nome'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    {d.cpf && <span>CPF: {formatCPF(d.cpf)}</span>}
                    {d.parentesco && <span>· {d.parentesco}</span>}
                    {d.data_nascimento && <span>· nasc. {formatDate(d.data_nascimento)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <>
          <EditarDadosPessoaisDialog
            open={editing === 'dados'}
            onOpenChange={(o) => !o && setEditing(null)}
            declaracaoId={declaracaoId}
            clienteId={clienteId!}
            anoBase={anoBase}
            initial={initial}
          />
          <EditarEnderecoDialog
            open={editing === 'endereco'}
            onOpenChange={(o) => !o && setEditing(null)}
            declaracaoId={declaracaoId}
            clienteId={clienteId!}
            anoBase={anoBase}
            initial={initial}
          />
          <EditarChavePixDialog
            open={editing === 'pix'}
            onOpenChange={(o) => !o && setEditing(null)}
            declaracaoId={declaracaoId}
            clienteId={clienteId!}
            anoBase={anoBase}
            initial={initial}
          />
          <EditarDependentesDialog
            open={editing === 'deps'}
            onOpenChange={(o) => !o && setEditing(null)}
            declaracaoId={declaracaoId}
            clienteId={clienteId!}
            anoBase={anoBase}
            initial={initial}
          />
        </>
      )}
    </div>
  );
}
