import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // API key is loaded per-action below
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prompt, curso_id, action, generated, model, provider } = await req.json();

    // Action: fetch existing content context
    if (action === "fetch_context") {
      const { data: cursos } = await supabase.from("cursos").select("id, nome, descricao, ordem").order("ordem");
      const { data: modulos } = await supabase.from("modulos").select("id, nome, descricao, ordem, curso_id").order("ordem");
      const { data: topicos } = await supabase.from("modulo_topicos").select("id, titulo, ordem, moedas, modulo_id").order("ordem");

      return new Response(JSON.stringify({ cursos, modulos, topicos }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: generate content with AI
    if (action === "generate") {
      // Fetch existing content for context
      let contextStr = "";

      if (curso_id) {
        const { data: curso } = await supabase.from("cursos").select("*").eq("id", curso_id).single();
        const { data: modulos } = await supabase.from("modulos").select("*").eq("curso_id", curso_id).order("ordem");
        const moduloIds = modulos?.map((m: any) => m.id) || [];

        let topicos: any[] = [];
        if (moduloIds.length > 0) {
          const { data } = await supabase.from("modulo_topicos").select("*").in("modulo_id", moduloIds).order("ordem");
          topicos = data || [];
        }

        contextStr = `
CURSO EXISTENTE: "${curso?.nome}" - ${curso?.descricao || "sem descrição"}

MÓDULOS EXISTENTES (${modulos?.length || 0}):
${modulos?.map((m: any) => {
  const mTopicos = topicos.filter((t: any) => t.modulo_id === m.id);
  return `- Módulo "${m.nome}" (ordem ${m.ordem}): ${mTopicos.length} tópicos
  Tópicos: ${mTopicos.map((t: any) => `"${t.titulo}" (ordem ${t.ordem})`).join(", ") || "nenhum"}`;
}).join("\n") || "Nenhum módulo"}
`;
      } else {
        const { data: cursos } = await supabase.from("cursos").select("id, nome, descricao").order("ordem");
        contextStr = `CURSOS EXISTENTES: ${cursos?.map((c: any) => `"${c.nome}"`).join(", ") || "Nenhum"}`;
      }

      const systemPrompt = `Você é um gerador de conteúdo educacional para uma plataforma de cursos. Você gera conteúdo nível universitário, mas de fácil entendimento, usando analogias do dia a dia.

CONTEXTO DO BANCO DE DADOS:
${contextStr}

REGRAS IMPORTANTES:
1. Retorne APENAS um JSON válido, sem markdown, sem \`\`\`, sem explicações extras.
2. O JSON deve ter esta estrutura:
{
  "curso": { "nome": "string", "descricao": "string", "is_new": boolean },
  "modulos": [
    {
      "nome": "string",
      "descricao": "string",
      "icone": "string (nome de ícone lucide: BookOpen, Code, Shield, Globe, Database, Server, Network, Brain, Cpu, Lock, Layers, GitBranch, Terminal, Workflow, FileCode)",
      "ordem": number,
      "topicos": [
        {
          "titulo": "string",
          "conteudo": "string (conteúdo em markdown com ## títulos, listas, tabelas, analogias, exemplos práticos, mínimo 300 palavras por tópico)",
          "ordem": number,
          "moedas": 5
        }
      ]
    }
  ],
  "resumos": [
    {
      "materia": "string (nome da matéria/área do conteúdo)",
      "titulo": "string (título do resumo)",
      "conteudo": "string (resumo completo em markdown, com pontos-chave, definições importantes e fórmulas se aplicável, mínimo 200 palavras)"
    }
  ]
}
3. Se o curso já existe (curso_id fornecido), coloque is_new: false e adicione APENAS módulos/tópicos NOVOS que ainda não existem.
4. Se for um curso novo, coloque is_new: true.
5. Use ordens que continuem a sequência existente.
6. O conteúdo de cada tópico deve ser rico, com analogias, exemplos, tabelas comparativas e exercícios mentais.
7. Cada módulo deve ter 2-4 tópicos.
8. Gere 1-3 resumos relacionados ao conteúdo criado. Os resumos devem ser sínteses úteis para revisão rápida.`;

      const useProvider = provider || "openrouter";
      let apiUrl: string;
      let apiKey: string;
      let extraHeaders: Record<string, string> = {};

      if (useProvider === "lovable") {
        apiKey = Deno.env.get("LOVABLE_API_KEY") || "";
        if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
        apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      } else {
        // Try DB key first, fallback to env var
        const { data: keysData } = await supabase
          .from("api_keys_config")
          .select("openrouter_api_key")
          .eq("id", 1)
          .single();
        apiKey = keysData?.openrouter_api_key || Deno.env.get("OPENROUTER_API_KEY") || "";
        if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
        apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        extraHeaders["HTTP-Referer"] = supabaseUrl;
      }

      const selectedModel = model || (useProvider === "lovable" ? "google/gemini-3-flash-preview" : "openai/gpt-4o-mini");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...extraHeaders,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 16000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter error:", response.status, errorText);
        
        let errorMsg = "Erro na API de IA";
        try {
          const errJson = JSON.parse(errorText);
          errorMsg = errJson?.error?.message || errorMsg;
        } catch {}

        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes no OpenRouter. Adicione créditos em openrouter.ai/settings/credits" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit atingido, tente novamente em instantes." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: errorMsg }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content;

      if (!content) {
        return new Response(JSON.stringify({ error: "IA não retornou conteúdo" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parse JSON from response (strip possible markdown fences)
      let parsed;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error("Failed to parse AI response:", content);
        return new Response(JSON.stringify({ error: "IA retornou formato inválido", raw: content }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ generated: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: insert generated content into DB
    if (action === "insert") {
      let targetCursoId = curso_id;

      const gen = generated || JSON.parse(prompt); // fallback

      if (gen.curso?.is_new && !targetCursoId) {
        const { data: newCurso, error } = await supabase.from("cursos").insert({
          nome: gen.curso.nome,
          descricao: gen.curso.descricao,
        }).select("id").single();

        if (error) throw error;
        targetCursoId = newCurso.id;
      }

      for (const modulo of gen.modulos || []) {
        const { data: newModulo, error: modError } = await supabase.from("modulos").insert({
          curso_id: targetCursoId,
          nome: modulo.nome,
          descricao: modulo.descricao,
          icone: modulo.icone || "BookOpen",
          ordem: modulo.ordem,
        }).select("id").single();

        if (modError) {
          console.error("Error inserting module:", modError);
          continue;
        }

        for (const topico of modulo.topicos || []) {
          const { error: topError } = await supabase.from("modulo_topicos").insert({
            modulo_id: newModulo.id,
            titulo: topico.titulo,
            conteudo: topico.conteudo,
            ordem: topico.ordem,
            moedas: topico.moedas || 5,
          });

          if (topError) {
            console.error("Error inserting topic:", topError);
          }
        }
      }

      // Insert resumos
      for (const resumo of gen.resumos || []) {
        const { error: resError } = await supabase.from("resumos").insert({
          materia: resumo.materia,
          titulo: resumo.titulo,
          conteudo: resumo.conteudo,
        });
        if (resError) {
          console.error("Error inserting resumo:", resError);
        }
      }

      return new Response(JSON.stringify({ success: true, curso_id: targetCursoId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
