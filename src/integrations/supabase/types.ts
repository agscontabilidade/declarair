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
        ]
      }
      clientes: {
        Row: {
          auth_user_id: string | null
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
          cliente_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          declaracao_id: string | null
          descricao: string
          escritorio_id: string
          id: string
          status: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          declaracao_id?: string | null
          descricao: string
          escritorio_id: string
          id?: string
          status?: string
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          declaracao_id?: string | null
          descricao?: string
          escritorio_id?: string
          id?: string
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
            foreignKeyName: "cobrancas_escritorio_id_fkey"
            columns: ["escritorio_id"]
            isOneToOne: false
            referencedRelation: "escritorios"
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
          id: string
          numero_recibo: string | null
          observacoes_internas: string | null
          status: string
          tipo_resultado: string | null
          ultima_atualizacao_status: string
          valor_resultado: number | null
        }
        Insert: {
          ano_base: number
          cliente_id: string
          contador_id?: string | null
          created_at?: string
          data_transmissao?: string | null
          escritorio_id: string
          id?: string
          numero_recibo?: string | null
          observacoes_internas?: string | null
          status?: string
          tipo_resultado?: string | null
          ultima_atualizacao_status?: string
          valor_resultado?: number | null
        }
        Update: {
          ano_base?: number
          cliente_id?: string
          contador_id?: string | null
          created_at?: string
          data_transmissao?: string | null
          escritorio_id?: string
          id?: string
          numero_recibo?: string | null
          observacoes_internas?: string | null
          status?: string
          tipo_resultado?: string | null
          ultima_atualizacao_status?: string
          valor_resultado?: number | null
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
      escritorios: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          limite_declaracoes: number | null
          logo_url: string | null
          nome: string
          plano: string | null
          telefone: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          limite_declaracoes?: number | null
          logo_url?: string | null
          nome: string
          plano?: string | null
          telefone?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          limite_declaracoes?: number | null
          logo_url?: string | null
          nome?: string
          plano?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      formulario_ir: {
        Row: {
          ano_base: number
          bens_direitos: Json
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
      usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          escritorio_id: string
          id: string
          nome: string
          papel: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          escritorio_id: string
          id: string
          nome: string
          papel?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          escritorio_id?: string
          id?: string
          nome?: string
          papel?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_cliente_por_token: {
        Args: { _token: string }
        Returns: {
          email: string
          escritorio_id: string
          id: string
          nome: string
        }[]
      }
      get_user_cliente_id: { Args: never; Returns: string }
      get_user_escritorio_id: { Args: never; Returns: string }
      get_user_papel: { Args: never; Returns: string }
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
    }
    Enums: {
      app_role: "dono" | "colaborador"
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
      app_role: ["dono", "colaborador"],
    },
  },
} as const
