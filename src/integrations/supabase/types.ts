export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addons: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          icone: string | null
          id: string
          nome: string
          preco: number
          tipo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          icone?: string | null
          id?: string
          nome: string
          preco?: number
          tipo?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          icone?: string | null
          id?: string
          nome?: string
          preco?: number
          tipo?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          escritorio_id: string
          expira_em: string | null
          id: string
          key_hash: string
          key_prefix: string
          nome: string
          permissoes: Json | null
          ultimo_uso: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          escritorio_id: string
          expira_em?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          nome: string
          permissoes?: Json | null
          ultimo_uso?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          escritorio_id?: string
          expira_em?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          nome?: string
          permissoes?: Json | null
          ultimo_uso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          asaas_subscription_id: string | null
          cancelado_em: string | null
          ciclo: string
          created_at: string
          escritorio_id: string
          id: string
          plano: string
          provider: string | null
          proxima_cobranca: string | null
          status: string
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          asaas_subscription_id?: string | null
          cancelado_em?: string | null
          ciclo?: string
          created_at?: string
          escritorio_id: string
          id?: string
          plano?: string
          provider?: string | null
          proxima_cobranca?: string | null
          status?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          asaas_subscription_id?: string | null
          cancelado_em?: string | null
          ciclo?: string
          created_at?: string
          escritorio_id?: string
          id?: string
          plano?: string
          provider?: string | null
          proxima_cobranca?: string | null
          status?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: true
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          created_at: string
          descricao: string
          escritorio_id: string | null
          id: string
          pagina_url: string | null
          prioridade: string
          reportado_por: string
          reportado_por_email: string | null
          reportado_por_nome: string | null
          resposta_admin: string | null
          screenshots: Json | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          escritorio_id?: string | null
          id?: string
          pagina_url?: string | null
          prioridade?: string
          reportado_por: string
          reportado_por_email?: string | null
          reportado_por_nome?: string | null
          resposta_admin?: string | null
          screenshots?: Json | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          escritorio_id?: string | null
          id?: string
          pagina_url?: string | null
          prioridade?: string
          reportado_por?: string
          reportado_por_email?: string | null
          reportado_por_nome?: string | null
          resposta_admin?: string | null
          screenshots?: Json | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_documentos: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string
          created_at: string
          data_recebimento: string | null
          declaracao_id: string
          id: string
          nome_documento: string
          obrigatorio: boolean
          status: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string
          created_at?: string
          data_recebimento?: string | null
          declaracao_id: string
          id?: string
          nome_documento: string
          obrigatorio?: boolean
          status?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string
          created_at?: string
          data_recebimento?: string | null
          declaracao_id?: string
          id?: string
          nome_documento?: string
          obrigatorio?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_documentos_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_documentos_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_cliente_view"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          auth_user_id: string | null
          conta_azul_id: string | null
          contador_responsavel_id: string | null
          cpf: string
          created_at: string
          data_nascimento: string | null
          email: string | null
          escritorio_id: string
          id: string
          nome: string
          status_onboarding: string
          telefone: string | null
          token_convite: string | null
          token_convite_expira_em: string | null
        }
        Insert: {
          auth_user_id?: string | null
          conta_azul_id?: string | null
          contador_responsavel_id?: string | null
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          escritorio_id: string
          id?: string
          nome: string
          status_onboarding?: string
          telefone?: string | null
          token_convite?: string | null
          token_convite_expira_em?: string | null
        }
        Update: {
          auth_user_id?: string | null
          conta_azul_id?: string | null
          contador_responsavel_id?: string | null
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          escritorio_id?: string
          id?: string
          nome?: string
          status_onboarding?: string
          telefone?: string | null
          token_convite?: string | null
          token_convite_expira_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_contador_responsavel_id_fkey"
            columns: ["contador_responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      cobrancas: {
        Row: {
          boleto_codigo_barras: string | null
          boleto_linha_digitavel: string | null
          boleto_pdf_url: string | null
          cliente_id: string
          cobranca_externa_id: string | null
          cobranca_externa_status: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          declaracao_id: string | null
          descricao: string
          escritorio_id: string
          id: string
          notificacao_vencimento_enviada: boolean
          pix_qrcode: string | null
          pix_qrcode_url: string | null
          status: string
          valor: number
        }
        Insert: {
          boleto_codigo_barras?: string | null
          boleto_linha_digitavel?: string | null
          boleto_pdf_url?: string | null
          cliente_id: string
          cobranca_externa_id?: string | null
          cobranca_externa_status?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          declaracao_id?: string | null
          descricao: string
          escritorio_id: string
          id?: string
          notificacao_vencimento_enviada?: boolean
          pix_qrcode?: string | null
          pix_qrcode_url?: string | null
          status?: string
          valor: number
        }
        Update: {
          boleto_codigo_barras?: string | null
          boleto_linha_digitavel?: string | null
          boleto_pdf_url?: string | null
          cliente_id?: string
          cobranca_externa_id?: string | null
          cobranca_externa_status?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          declaracao_id?: string | null
          descricao?: string
          escritorio_id?: string
          id?: string
          notificacao_vencimento_enviada?: boolean
          pix_qrcode?: string | null
          pix_qrcode_url?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_cliente_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_convites: {
        Row: {
          created_at: string
          email: string
          enviado_por: string
          escritorio_id: string
          expira_em: string
          id: string
          nome: string
          papel: string
          token: string
          usado: boolean
          usado_em: string | null
        }
        Insert: {
          created_at?: string
          email: string
          enviado_por: string
          escritorio_id: string
          expira_em: string
          id?: string
          nome: string
          papel?: string
          token: string
          usado?: boolean
          usado_em?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          enviado_por?: string
          escritorio_id?: string
          expira_em?: string
          id?: string
          nome?: string
          papel?: string
          token?: string
          usado?: boolean
          usado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_convites_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_escritorio: {
        Row: {
          chave: string
          created_at: string
          escritorio_id: string
          id: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          escritorio_id: string
          id?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          escritorio_id?: string
          id?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_escritorio_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_cliente: {
        Row: {
          cpf_sugerido: string | null
          created_at: string | null
          created_by: string | null
          email_sugerido: string | null
          escritorio_id: string
          expira_em: string | null
          id: string
          mensagem_personalizada: string | null
          nome_sugerido: string | null
          token: string
          usado: boolean | null
          usado_em: string | null
          usado_por_cliente_id: string | null
        }
        Insert: {
          cpf_sugerido?: string | null
          created_at?: string | null
          created_by?: string | null
          email_sugerido?: string | null
          escritorio_id: string
          expira_em?: string | null
          id?: string
          mensagem_personalizada?: string | null
          nome_sugerido?: string | null
          token: string
          usado?: boolean | null
          usado_em?: string | null
          usado_por_cliente_id?: string | null
        }
        Update: {
          cpf_sugerido?: string | null
          created_at?: string | null
          created_by?: string | null
          email_sugerido?: string | null
          escritorio_id?: string
          expira_em?: string | null
          id?: string
          mensagem_personalizada?: string | null
          nome_sugerido?: string | null
          token?: string
          usado?: boolean | null
          usado_em?: string | null
          usado_por_cliente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_cliente_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_cliente_usado_por_cliente_id_fkey"
            columns: ["usado_por_cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      declaracao_atividades: {
        Row: {
          created_at: string
          declaracao_id: string
          descricao: string
          id: string
          tipo: string
          usuario_nome: string | null
        }
        Insert: {
          created_at?: string
          declaracao_id: string
          descricao: string
          id?: string
          tipo: string
          usuario_nome?: string | null
        }
        Update: {
          created_at?: string
          declaracao_id?: string
          descricao?: string
          id?: string
          tipo?: string
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "declaracao_atividades_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declaracao_atividades_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_cliente_view"
            referencedColumns: ["id"]
          },
        ]
      }
      declaracoes: {
        Row: {
          ano_base: number
          cliente_id: string
          contador_id: string | null
          created_at: string
          data_transmissao: string | null
          escritorio_id: string
          forma_tributacao: string | null
          id: string
          numero_recibo: string | null
          observacoes_internas: string | null
          status: string
          tipo_resultado: string | null
          ultima_atualizacao_status: string
          valor_resultado: number | null
          version: number
        }
        Insert: {
          ano_base: number
          cliente_id: string
          contador_id?: string | null
          created_at?: string
          data_transmissao?: string | null
          escritorio_id: string
          forma_tributacao?: string | null
          id?: string
          numero_recibo?: string | null
          observacoes_internas?: string | null
          status?: string
          tipo_resultado?: string | null
          ultima_atualizacao_status?: string
          valor_resultado?: number | null
          version?: number
        }
        Update: {
          ano_base?: number
          cliente_id?: string
          contador_id?: string | null
          created_at?: string
          data_transmissao?: string | null
          escritorio_id?: string
          forma_tributacao?: string | null
          id?: string
          numero_recibo?: string | null
          observacoes_internas?: string | null
          status?: string
          tipo_resultado?: string | null
          ultima_atualizacao_status?: string
          valor_resultado?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "declaracoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declaracoes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declaracoes_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      declaracoes_extras: {
        Row: {
          cobranca_id: string | null
          created_at: string | null
          escritorio_id: string
          id: string
          mes_referencia: string
          quantidade: number
          valor_total: number | null
          valor_unitario: number
        }
        Insert: {
          cobranca_id?: string | null
          created_at?: string | null
          escritorio_id: string
          id?: string
          mes_referencia?: string
          quantidade: number
          valor_total?: number | null
          valor_unitario?: number
        }
        Update: {
          cobranca_id?: string | null
          created_at?: string | null
          escritorio_id?: string
          id?: string
          mes_referencia?: string
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "declaracoes_extras_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declaracoes_extras_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      escritorio_addons: {
        Row: {
          addon_id: string
          ativado_em: string
          created_at: string
          desativado_em: string | null
          escritorio_id: string
          id: string
          status: string
          stripe_subscription_item_id: string | null
        }
        Insert: {
          addon_id: string
          ativado_em?: string
          created_at?: string
          desativado_em?: string | null
          escritorio_id: string
          id?: string
          status?: string
          stripe_subscription_item_id?: string | null
        }
        Update: {
          addon_id?: string
          ativado_em?: string
          created_at?: string
          desativado_em?: string | null
          escritorio_id?: string
          id?: string
          status?: string
          stripe_subscription_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escritorio_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
        ]
      }
      escritorios: {
        Row: {
          asaas_customer_id: string | null
          chave_pix: string | null
          cnpj: string | null
          cor_fundo_portal: string | null
          cor_primaria: string | null
          created_at: string
          declaracoes_utilizadas: number | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          favicon_url: string | null
          id: string
          limite_declaracoes: number | null
          logo_url: string | null
          nome: string
          nome_fantasia: string | null
          nome_portal: string | null
          onboarding_completo: boolean
          plano: string | null
          plano_expira_em: string | null
          razao_social: string | null
          storage_limite_mb: number | null
          stripe_customer_id: string | null
          telefone: string | null
          texto_boas_vindas: string | null
          usuarios_limite: number | null
          whatsapp: string | null
          whitelabel_ativo: boolean | null
        }
        Insert: {
          asaas_customer_id?: string | null
          chave_pix?: string | null
          cnpj?: string | null
          cor_fundo_portal?: string | null
          cor_primaria?: string | null
          created_at?: string
          declaracoes_utilizadas?: number | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          favicon_url?: string | null
          id?: string
          limite_declaracoes?: number | null
          logo_url?: string | null
          nome: string
          nome_fantasia?: string | null
          nome_portal?: string | null
          onboarding_completo?: boolean
          plano?: string | null
          plano_expira_em?: string | null
          razao_social?: string | null
          storage_limite_mb?: number | null
          stripe_customer_id?: string | null
          telefone?: string | null
          texto_boas_vindas?: string | null
          usuarios_limite?: number | null
          whatsapp?: string | null
          whitelabel_ativo?: boolean | null
        }
        Update: {
          asaas_customer_id?: string | null
          chave_pix?: string | null
          cnpj?: string | null
          cor_fundo_portal?: string | null
          cor_primaria?: string | null
          created_at?: string
          declaracoes_utilizadas?: number | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          favicon_url?: string | null
          id?: string
          limite_declaracoes?: number | null
          logo_url?: string | null
          nome?: string
          nome_fantasia?: string | null
          nome_portal?: string | null
          onboarding_completo?: boolean
          plano?: string | null
          plano_expira_em?: string | null
          razao_social?: string | null
          storage_limite_mb?: number | null
          stripe_customer_id?: string | null
          telefone?: string | null
          texto_boas_vindas?: string | null
          usuarios_limite?: number | null
          whatsapp?: string | null
          whitelabel_ativo?: boolean | null
        }
        Relationships: []
      }
      formulario_ir: {
        Row: {
          ano_base: number
          bens_direitos: Json
          chave_pix_cliente: string | null
          cliente_id: string
          conjuge_cpf: string | null
          conjuge_nome: string | null
          created_at: string
          declaracao_id: string
          dependentes: Json
          despesas_educacao: Json
          despesas_medicas: Json
          dividas_onus: Json
          estado_civil: string | null
          id: string
          informacoes_adicionais: string | null
          outros_rendimentos: Json
          perfil_fiscal: Json
          previdencia_privada: Json
          rendimentos_aluguel: Json
          rendimentos_autonomo: Json
          rendimentos_emprego: Json
          status_preenchimento: string
          ultima_atualizacao: string
        }
        Insert: {
          ano_base: number
          bens_direitos?: Json
          chave_pix_cliente?: string | null
          cliente_id: string
          conjuge_cpf?: string | null
          conjuge_nome?: string | null
          created_at?: string
          declaracao_id: string
          dependentes?: Json
          despesas_educacao?: Json
          despesas_medicas?: Json
          dividas_onus?: Json
          estado_civil?: string | null
          id?: string
          informacoes_adicionais?: string | null
          outros_rendimentos?: Json
          perfil_fiscal?: Json
          previdencia_privada?: Json
          rendimentos_aluguel?: Json
          rendimentos_autonomo?: Json
          rendimentos_emprego?: Json
          status_preenchimento?: string
          ultima_atualizacao?: string
        }
        Update: {
          ano_base?: number
          bens_direitos?: Json
          chave_pix_cliente?: string | null
          cliente_id?: string
          conjuge_cpf?: string | null
          conjuge_nome?: string | null
          created_at?: string
          declaracao_id?: string
          dependentes?: Json
          despesas_educacao?: Json
          despesas_medicas?: Json
          dividas_onus?: Json
          estado_civil?: string | null
          id?: string
          informacoes_adicionais?: string | null
          outros_rendimentos?: Json
          perfil_fiscal?: Json
          previdencia_privada?: Json
          rendimentos_aluguel?: Json
          rendimentos_autonomo?: Json
          rendimentos_emprego?: Json
          status_preenchimento?: string
          ultima_atualizacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "formulario_ir_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulario_ir_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: true
            referencedRelation: "declaracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulario_ir_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: true
            referencedRelation: "declaracoes_cliente_view"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes_contaazul: {
        Row: {
          access_token_encrypted: string | null
          ativo: boolean | null
          client_id: string
          client_secret_encrypted: string
          created_at: string | null
          escritorio_id: string
          id: string
          refresh_token_encrypted: string | null
          token_expira_em: string | null
          ultima_sincronizacao: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          ativo?: boolean | null
          client_id: string
          client_secret_encrypted: string
          created_at?: string | null
          escritorio_id: string
          id?: string
          refresh_token_encrypted?: string | null
          token_expira_em?: string | null
          ultima_sincronizacao?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          ativo?: boolean | null
          client_id?: string
          client_secret_encrypted?: string
          created_at?: string | null
          escritorio_id?: string
          id?: string
          refresh_token_encrypted?: string | null
          token_expira_em?: string | null
          ultima_sincronizacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_contaazul_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: true
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      malha_fina_consultas: {
        Row: {
          ano_base: number
          cliente_id: string
          cpf: string
          created_at: string
          data_consulta: string | null
          declaracao_id: string
          escritorio_id: string
          id: string
          resultado_json: Json | null
          situacao_cadastral: string | null
          status_rfb: string
          ultima_consulta: string | null
          ultimo_resultado: string | null
        }
        Insert: {
          ano_base: number
          cliente_id: string
          cpf: string
          created_at?: string
          data_consulta?: string | null
          declaracao_id: string
          escritorio_id: string
          id?: string
          resultado_json?: Json | null
          situacao_cadastral?: string | null
          status_rfb?: string
          ultima_consulta?: string | null
          ultimo_resultado?: string | null
        }
        Update: {
          ano_base?: number
          cliente_id?: string
          cpf?: string
          created_at?: string
          data_consulta?: string | null
          declaracao_id?: string
          escritorio_id?: string
          id?: string
          resultado_json?: Json | null
          situacao_cadastral?: string | null
          status_rfb?: string
          ultima_consulta?: string | null
          ultimo_resultado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "malha_fina_consultas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "malha_fina_consultas_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "malha_fina_consultas_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_cliente_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "malha_fina_consultas_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat: {
        Row: {
          cliente_id: string
          conteudo: string
          created_at: string
          declaracao_id: string
          enviado_whatsapp: boolean | null
          escritorio_id: string
          id: string
          lida: boolean | null
          remetente_id: string | null
          remetente_tipo: string
          whatsapp_enviado_em: string | null
          whatsapp_erro: string | null
          whatsapp_tentativas: number | null
        }
        Insert: {
          cliente_id: string
          conteudo: string
          created_at?: string
          declaracao_id: string
          enviado_whatsapp?: boolean | null
          escritorio_id: string
          id?: string
          lida?: boolean | null
          remetente_id?: string | null
          remetente_tipo?: string
          whatsapp_enviado_em?: string | null
          whatsapp_erro?: string | null
          whatsapp_tentativas?: number | null
        }
        Update: {
          cliente_id?: string
          conteudo?: string
          created_at?: string
          declaracao_id?: string
          enviado_whatsapp?: boolean | null
          escritorio_id?: string
          id?: string
          lida?: boolean | null
          remetente_id?: string | null
          remetente_tipo?: string
          whatsapp_enviado_em?: string | null
          whatsapp_erro?: string | null
          whatsapp_tentativas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_cliente_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_enviadas: {
        Row: {
          canal: string
          cliente_id: string | null
          conteudo_final: string
          enviado_em: string
          escritorio_id: string
          id: string
          status: string
          template_id: string | null
        }
        Insert: {
          canal: string
          cliente_id?: string | null
          conteudo_final: string
          enviado_em?: string
          escritorio_id: string
          id?: string
          status?: string
          template_id?: string | null
        }
        Update: {
          canal?: string
          cliente_id?: string | null
          conteudo_final?: string
          enviado_em?: string
          escritorio_id?: string
          id?: string
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_enviadas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_enviadas_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_enviadas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_mensagem"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          escritorio_id: string
          id: string
          lida: boolean
          link_destino: string | null
          mensagem: string
          titulo: string
        }
        Insert: {
          created_at?: string
          escritorio_id: string
          id?: string
          lida?: boolean
          link_destino?: string | null
          mensagem: string
          titulo: string
        }
        Update: {
          created_at?: string
          escritorio_id?: string
          id?: string
          lida?: boolean
          link_destino?: string | null
          mensagem?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_assinatura: {
        Row: {
          asaas_payment_id: string | null
          assinatura_id: string | null
          boleto_linha_digitavel: string | null
          boleto_url: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          escritorio_id: string
          forma_pagamento: string | null
          id: string
          pix_qrcode: string | null
          pix_qrcode_url: string | null
          provider: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          valor: number
        }
        Insert: {
          asaas_payment_id?: string | null
          assinatura_id?: string | null
          boleto_linha_digitavel?: string | null
          boleto_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          escritorio_id: string
          forma_pagamento?: string | null
          id?: string
          pix_qrcode?: string | null
          pix_qrcode_url?: string | null
          provider?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          valor: number
        }
        Update: {
          asaas_payment_id?: string | null
          assinatura_id?: string | null
          boleto_linha_digitavel?: string | null
          boleto_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          escritorio_id?: string
          forma_pagamento?: string | null
          id?: string
          pix_qrcode?: string | null
          pix_qrcode_url?: string | null
          provider?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_assinatura_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_assinatura_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes: {
        Row: {
          categoria: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          mensagem: string | null
          metadata: Json | null
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem?: string | null
          metadata?: Json | null
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string | null
          metadata?: Json | null
          tipo?: string
        }
        Relationships: []
      }
      templates_mensagem: {
        Row: {
          assunto: string | null
          ativo: boolean
          canal: string
          corpo: string
          created_at: string
          escritorio_id: string
          id: string
          nome: string
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean
          canal?: string
          corpo: string
          created_at?: string
          escritorio_id: string
          id?: string
          nome: string
        }
        Update: {
          assunto?: string | null
          ativo?: boolean
          canal?: string
          corpo?: string
          created_at?: string
          escritorio_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_mensagem_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuario_permissoes: {
        Row: {
          created_at: string | null
          escritorio_id: string
          id: string
          permissao_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          escritorio_id: string
          id?: string
          permissao_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          escritorio_id?: string
          id?: string
          permissao_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_permissoes_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_permissoes_permissao_id_fkey"
            columns: ["permissao_id"]
            isOneToOne: false
            referencedRelation: "permissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string
          email: string
          escritorio_id: string
          id: string
          nome: string
          papel: string
          preferencias_notificacao: Json | null
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          escritorio_id: string
          id: string
          nome: string
          papel?: string
          preferencias_notificacao?: Json | null
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          escritorio_id?: string
          id?: string
          nome?: string
          papel?: string
          preferencias_notificacao?: Json | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          escritorio_id: string
          id: string
          instance_name: string
          phone: string | null
          profile_name: string | null
          profile_picture_url: string | null
          qrcode_base64: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          escritorio_id: string
          id?: string
          instance_name: string
          phone?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          qrcode_base64?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          escritorio_id?: string
          id?: string
          instance_name?: string
          phone?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          qrcode_base64?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: true
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      declaracoes_cliente_view: {
        Row: {
          ano_base: number | null
          cliente_id: string | null
          contador_id: string | null
          created_at: string | null
          data_transmissao: string | null
          escritorio_id: string | null
          forma_tributacao: string | null
          id: string | null
          numero_recibo: string | null
          status: string | null
          tipo_resultado: string | null
          ultima_atualizacao_status: string | null
          valor_resultado: number | null
          version: number | null
        }
        Insert: {
          ano_base?: number | null
          cliente_id?: string | null
          contador_id?: string | null
          created_at?: string | null
          data_transmissao?: string | null
          escritorio_id?: string | null
          forma_tributacao?: string | null
          id?: string | null
          numero_recibo?: string | null
          status?: string | null
          tipo_resultado?: string | null
          ultima_atualizacao_status?: string | null
          valor_resultado?: number | null
          version?: number | null
        }
        Update: {
          ano_base?: number | null
          cliente_id?: string | null
          contador_id?: string | null
          created_at?: string | null
          data_transmissao?: string | null
          escritorio_id?: string | null
          forma_tributacao?: string | null
          id?: string | null
          numero_recibo?: string | null
          status?: string | null
          tipo_resultado?: string | null
          ultima_atualizacao_status?: string | null
          valor_resultado?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "declaracoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declaracoes_contador_id_fkey"
            columns: ["contador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "declaracoes_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      atualizar_cobrancas_vencidas: { Args: never; Returns: undefined }
      buscar_cliente_por_token: {
        Args: { _token: string }
        Returns: {
          email: string
          escritorio_id: string
          id: string
          nome: string
        }[]
      }
      check_can_create_declaracao: {
        Args: { escritorio_uuid: string }
        Returns: boolean
      }
      count_declaracoes_ativas: {
        Args: { escritorio_uuid: string }
        Returns: number
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_clientes_for_user: {
        Args: never
        Returns: {
          auth_user_id: string | null
          conta_azul_id: string | null
          contador_responsavel_id: string | null
          cpf: string
          created_at: string
          data_nascimento: string | null
          email: string | null
          escritorio_id: string
          id: string
          nome: string
          status_onboarding: string
          telefone: string | null
          token_convite: string | null
          token_convite_expira_em: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "clientes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_cliente_id: { Args: never; Returns: string }
      get_user_escritorio_id: { Args: never; Returns: string }
      get_user_papel: { Args: never; Returns: string }
      get_user_papel_safe: { Args: never; Returns: string }
      handle_new_accountant_signup: {
        Args: {
          p_email: string
          p_nome: string
          p_nome_escritorio: string
          p_user_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cliente: { Args: never; Returns: boolean }
      limpar_token_convite:
        | { Args: { _cliente_id: string }; Returns: undefined }
        | {
            Args: { _auth_user_id: string; _cliente_id: string }
            Returns: undefined
          }
      marcar_mensagens_lidas: {
        Args: { p_declaracao_id: string; p_remetente_tipo: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notificar_cobrancas_vencendo: { Args: never; Returns: undefined }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      user_tem_permissao: { Args: { permissao_nome: string }; Returns: boolean }
    }
    Enums: {
      app_role: "dono" | "colaborador" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["dono", "colaborador", "admin"],
    },
  },
} as const
