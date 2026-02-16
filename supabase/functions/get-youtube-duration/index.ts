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

    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    if (!match) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid YouTube URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoId = match[1];
    console.log('Fetching duration for video:', videoId);

    // Method 1: YouTube innertube API with ANDROID client (less restrictive)
    try {
      const innertubeResponse = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false&key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '19.09.37',
              androidSdkVersion: 30,
              hl: 'en',
              gl: 'US',
            },
          },
        }),
      });

      if (innertubeResponse.ok) {
        const data = await innertubeResponse.json();
        const lengthSeconds = data?.videoDetails?.lengthSeconds;
        if (lengthSeconds) {
          const seconds = parseInt(lengthSeconds);
          const minutes = Math.ceil(seconds / 60);
          console.log(`Duration found via innertube ANDROID: ${seconds}s (${minutes}min)`);
          return new Response(
            JSON.stringify({ success: true, duration: minutes, durationSeconds: seconds }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Innertube ANDROID response status:', data?.playabilityStatus?.status);
      }
    } catch (e) {
      console.log('Innertube ANDROID error:', e);
    }

    // Method 2: YouTube innertube with WEB client
    try {
      const webResponse = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/',
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20241001.00.00',
              hl: 'en',
            },
          },
        }),
      });

      if (webResponse.ok) {
        const data = await webResponse.json();
        const lengthSeconds = data?.videoDetails?.lengthSeconds;
        if (lengthSeconds) {
          const seconds = parseInt(lengthSeconds);
          const minutes = Math.ceil(seconds / 60);
          console.log(`Duration found via innertube WEB: ${seconds}s (${minutes}min)`);
          return new Response(
            JSON.stringify({ success: true, duration: minutes, durationSeconds: seconds }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Innertube WEB status:', data?.playabilityStatus?.status, JSON.stringify(data?.playabilityStatus?.reason || '').slice(0, 200));
      }
    } catch (e) {
      console.log('Innertube WEB error:', e);
    }

    // Method 3: Scrape the watch page
    try {
      const watchResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk2NDEwNjQzMTAaAmVuIAEaBgiA_LyaBg',
        },
      });
      const html = await watchResponse.text();

      const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
      if (lengthMatch) {
        const seconds = parseInt(lengthMatch[1]);
        const minutes = Math.ceil(seconds / 60);
        console.log(`Duration found via scrape: ${seconds}s (${minutes}min)`);
        return new Response(
          JSON.stringify({ success: true, duration: minutes, durationSeconds: seconds }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
      if (approxMatch) {
        const ms = parseInt(approxMatch[1]);
        const minutes = Math.ceil(ms / 60000);
        return new Response(
          JSON.stringify({ success: true, duration: minutes, durationSeconds: Math.ceil(ms / 1000) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Log a snippet to debug
      console.log('Page length:', html.length, 'Contains lengthSeconds:', html.includes('lengthSeconds'));
    } catch (e) {
      console.log('Scrape error:', e);
    }

    console.log('Duration not found in any source');
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
