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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_config: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: number
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: number
          nome?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      anotacoes: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          materia: string | null
          tags: string[] | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          materia?: string | null
          tags?: string[] | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          materia?: string | null
          tags?: string[] | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_features: {
        Row: {
          created_at: string
          id: number
          music_enabled: boolean
          news_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          music_enabled?: boolean
          news_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          music_enabled?: boolean
          news_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      assistant_config: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: number
          model: string
          recado: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: number
          model?: string
          recado?: string
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: number
          model?: string
          recado?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      belinha_stories: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          image_url: string
          texto: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url: string
          texto?: string | null
          tipo?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string
          texto?: string | null
          tipo?: string
        }
        Relationships: []
      }
      certificado_config: {
        Row: {
          created_at: string
          creditos_minimos: number
          id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          creditos_minimos?: number
          id?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          creditos_minimos?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      certificado_solicitacoes: {
        Row: {
          certificado_url: string | null
          created_at: string
          curso_id: string | null
          curso_nome: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificado_url?: string | null
          created_at?: string
          curso_id?: string | null
          curso_nome?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificado_url?: string | null
          created_at?: string
          curso_id?: string | null
          curso_nome?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificado_solicitacoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma: {
        Row: {
          concluida: boolean
          created_at: string
          dia_semana: number
          horario: string
          id: string
          materia: string
          titulo: string
          user_id: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          dia_semana: number
          horario: string
          id?: string
          materia: string
          titulo: string
          user_id: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          dia_semana?: number
          horario?: string
          id?: string
          materia?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      cruzadas_palavras: {
        Row: {
          created_at: string
          dica: string
          id: string
          palavra: string
        }
        Insert: {
          created_at?: string
          dica: string
          id?: string
          palavra: string
        }
        Update: {
          created_at?: string
          dica?: string
          id?: string
          palavra?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      desafio_respostas: {
        Row: {
          created_at: string
          desafio_id: string
          id: string
          resposta_usuario: number
          user_id: string
        }
        Insert: {
          created_at?: string
          desafio_id: string
          id?: string
          resposta_usuario: number
          user_id: string
        }
        Update: {
          created_at?: string
          desafio_id?: string
          id?: string
          resposta_usuario?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desafio_respostas_desafio_id_fkey"
            columns: ["desafio_id"]
            isOneToOne: false
            referencedRelation: "desafios_semanais"
            referencedColumns: ["id"]
          },
        ]
      }
      desafios_semanais: {
        Row: {
          correta: number
          created_at: string
          id: string
          moedas: number
          opcoes: string[]
          pergunta: string
        }
        Insert: {
          correta: number
          created_at?: string
          id?: string
          moedas?: number
          opcoes: string[]
          pergunta: string
        }
        Update: {
          correta?: number
          created_at?: string
          id?: string
          moedas?: number
          opcoes?: string[]
          pergunta?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          created_at: string
          id: string
          materia: string
          pergunta: string
          resposta: string
        }
        Insert: {
          created_at?: string
          id?: string
          materia: string
          pergunta: string
          resposta: string
        }
        Update: {
          created_at?: string
          id?: string
          materia?: string
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      forca_palavras: {
        Row: {
          created_at: string
          dica: string
          id: string
          palavra: string
        }
        Insert: {
          created_at?: string
          dica: string
          id?: string
          palavra: string
        }
        Update: {
          created_at?: string
          dica?: string
          id?: string
          palavra?: string
        }
        Relationships: []
      }
      frases_motivacionais: {
        Row: {
          ativa: boolean
          created_at: string
          id: string
          texto: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          id?: string
          texto: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          id?: string
          texto?: string
        }
        Relationships: []
      }
      materias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      memoria_pares: {
        Row: {
          created_at: string
          definicao: string
          id: string
          termo: string
        }
        Insert: {
          created_at?: string
          definicao: string
          id?: string
          termo: string
        }
        Update: {
          created_at?: string
          definicao?: string
          id?: string
          termo?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conteudo: string
          created_at: string
          editado: boolean
          id: string
          lida: boolean
          remetente: string
          reply_to: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string
          editado?: boolean
          id?: string
          lida?: boolean
          remetente?: string
          reply_to?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string
          editado?: boolean
          id?: string
          lida?: boolean
          remetente?: string
          reply_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      modulo_topicos: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          modulo_id: string
          moedas: number
          ordem: number
          titulo: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          modulo_id: string
          moedas?: number
          ordem?: number
          titulo: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          modulo_id?: string
          moedas?: number
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulo_topicos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          created_at: string
          curso_id: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          curso_id?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string
          curso_id?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      ordenar_passos: {
        Row: {
          created_at: string
          explicacao: string | null
          id: string
          passos: string[]
          titulo: string
        }
        Insert: {
          created_at?: string
          explicacao?: string | null
          id?: string
          passos: string[]
          titulo: string
        }
        Update: {
          created_at?: string
          explicacao?: string | null
          id?: string
          passos?: string[]
          titulo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correta: number
          created_at: string
          id: string
          materia: string
          opcoes: string[]
          pergunta: string
        }
        Insert: {
          correta: number
          created_at?: string
          id?: string
          materia: string
          opcoes: string[]
          pergunta: string
        }
        Update: {
          correta?: number
          created_at?: string
          id?: string
          materia?: string
          opcoes?: string[]
          pergunta?: string
        }
        Relationships: []
      }
      resgate_solicitacoes: {
        Row: {
          chave_pix: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
          valor_moedas: number
        }
        Insert: {
          chave_pix: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          valor_moedas: number
        }
        Update: {
          chave_pix?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor_moedas?: number
        }
        Relationships: []
      }
      resumos: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          materia: string
          titulo: string
          updated_at: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          materia: string
          titulo: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          materia?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      topico_progresso: {
        Row: {
          concluido_em: string
          id: string
          topico_id: string
          user_id: string
        }
        Insert: {
          concluido_em?: string
          id?: string
          topico_id: string
          user_id: string
        }
        Update: {
          concluido_em?: string
          id?: string
          topico_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topico_progresso_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "modulo_topicos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_music_preferences: {
        Row: {
          created_at: string
          genre_ids: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genre_ids: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          genre_ids?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_assistido: {
        Row: {
          assistido_em: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          assistido_em?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          assistido_em?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_assistido_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      videos: {
        Row: {
          categoria_id: string | null
          created_at: string
          descricao: string | null
          duracao: number
          id: string
          moedas: number
          ordem: number
          titulo: string
          updated_at: string
          url_youtube: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          duracao: number
          id?: string
          moedas?: number
          ordem?: number
          titulo: string
          updated_at?: string
          url_youtube: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          duracao?: number
          id?: string
          moedas?: number
          ordem?: number
          titulo?: string
          updated_at?: string
          url_youtube?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "video_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
