import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get('url');

    if (!videoUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward range header for seeking support
    const headers: Record<string, string> = {};
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await fetch(videoUrl, { headers });

    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': response.headers.get('content-type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
    };

    const contentLength = response.headers.get('content-length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    const contentRange = response.headers.get('content-range');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
