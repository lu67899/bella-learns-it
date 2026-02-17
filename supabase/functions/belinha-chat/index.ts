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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch assistant config from DB
    const { data: config, error: configError } = await supabase
      .from("assistant_config")
      .select("system_prompt, model, provider")
      .eq("id", 1)
      .single();

    if (configError || !config) {
      throw new Error("Failed to load assistant config");
    }

    const { messages } = await req.json();

    const useProvider = config.provider || "openrouter";
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

    const selectedModel = config.model || (useProvider === "lovable" ? "google/gemini-3-flash-preview" : "openai/gpt-4o-mini");

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
          { role: "system", content: config.system_prompt },
          ...messages,
        ],
        max_tokens: 8192,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);

      let errorMsg = "Erro na API de IA";
      try {
        const errJson = JSON.parse(errorText);
        errorMsg = errJson?.error?.message || errorMsg;
      } catch {}

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido, tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes na API de IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("belinha-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
