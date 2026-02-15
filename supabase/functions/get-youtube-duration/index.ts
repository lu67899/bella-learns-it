const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    if (!match) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid YouTube URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoId = match[1];
    console.log('Fetching duration for video:', videoId);

    // Fetch YouTube page to extract duration from embedded data
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    const html = await response.text();

    // Try to extract lengthSeconds from the page data
    const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
    
    if (lengthMatch) {
      const seconds = parseInt(lengthMatch[1]);
      const minutes = Math.ceil(seconds / 60);
      console.log(`Duration found: ${seconds}s (${minutes}min)`);
      return new Response(
        JSON.stringify({ success: true, duration: minutes, durationSeconds: seconds }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: try approxDurationMs
    const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
    if (approxMatch) {
      const ms = parseInt(approxMatch[1]);
      const minutes = Math.ceil(ms / 60000);
      console.log(`Duration found (approx): ${ms}ms (${minutes}min)`);
      return new Response(
        JSON.stringify({ success: true, duration: minutes, durationSeconds: Math.ceil(ms / 1000) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Duration not found in page data');
    return new Response(
      JSON.stringify({ success: false, error: 'Could not extract duration' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
