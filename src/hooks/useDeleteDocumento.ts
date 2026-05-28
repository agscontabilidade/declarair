import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errors';
import type { ViewerFile } from '@/components/drive/FileViewerModal';

interface UseDeleteDocumentoOptions {
  /** Lista atual de arquivos no viewer (para descobrir o storage path). */
  getFiles: () => ViewerFile[];
  /** Chamado após exclusão bem-sucedida com a lista restante e o próximo id (ou null se vazio). */
  onAfterDelete?: (remaining: ViewerFile[], nextId: string | null, deletedId: string) => void;
}

/**
 * Mutação compartilhada para excluir um documento do checklist:
 * - remove o arquivo (e sidecar .ocr.pdf) do bucket `documentos-clientes`
 * - zera os campos de arquivo na linha de `checklist_documentos` (volta para "pendente")
 * - invalida as queries do Drive, abas da declaração e checklist
 */
export function useDeleteDocumento({ getFiles, onAfterDelete }: UseDeleteDocumentoOptions) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const file = getFiles().find((f) => f.id === id);
      const path = file?.arquivo_url;
      if (path) {
        await supabase.storage.from('documentos-clientes').remove([path, `${path}.ocr.pdf`]);
      }
      const { error } = await supabase
        .from('checklist_documentos')
        .update({
          arquivo_url: null,
          arquivo_nome: null,
          data_recebimento: null,
          status: 'pendente',
          lancado: false,
          lancado_em: null,
          lancado_por: null,
        })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      toast.success('Documento excluído');
      const files = getFiles();
      const idx = files.findIndex((f) => f.id === id);
      const remaining = files.filter((f) => f.id !== id);
      const nextId = remaining.length === 0
        ? null
        : remaining[Math.min(idx, remaining.length - 1)].id;
      onAfterDelete?.(remaining, nextId, id);
      queryClient.invalidateQueries({ queryKey: ['drive-docs'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-declaracao'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist'] });
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Falha ao excluir documento')),
    onSettled: () => setDeletingId(null),
  });

  return { deleteDoc, deletingId };
}
