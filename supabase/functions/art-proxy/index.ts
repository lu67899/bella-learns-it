const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

interface MetObject {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  medium: string;
  dimensions: string;
  primaryImage: string;
  primaryImageSmall: string;
  department: string;
  culture: string;
  period: string;
  objectURL: string;
  isPublicDomain: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, page = 1, limit = 12 } = await req.json();

    // Search for artworks
    const searchQuery = query || "painting";
    const searchUrl = `${MET_BASE}/search?q=${encodeURIComponent(searchQuery)}&hasImages=true&isPublicDomain=true&medium=Paintings`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
      return new Response(JSON.stringify({ data: [], total: 0, hasMore: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalIds = searchData.objectIDs.length;
    const start = (page - 1) * limit;
    const end = Math.min(start + limit, totalIds);
    const pageIds = searchData.objectIDs.slice(start, end);

    // Fetch object details in parallel
    const objectPromises = pageIds.map(async (id: number) => {
      try {
        const res = await fetch(`${MET_BASE}/objects/${id}`);
        if (!res.ok) return null;
        const obj: MetObject = await res.json();
        if (!obj.primaryImageSmall && !obj.primaryImage) return null;
        return {
          id: obj.objectID,
          title: obj.title,
          artist_display: obj.artistDisplayName || "Artista desconhecido",
          date_display: obj.objectDate,
          medium_display: obj.medium,
          dimensions: obj.dimensions,
          image_url: obj.primaryImageSmall || obj.primaryImage,
          image_url_large: obj.primaryImage || obj.primaryImageSmall,
          department: obj.department,
          culture: obj.culture,
          period: obj.period,
          external_url: obj.objectURL,
        };
      } catch {
        return null;
      }
    });

    const objects = (await Promise.all(objectPromises)).filter(Boolean);

    return new Response(JSON.stringify({
      data: objects,
      total: totalIds,
      hasMore: end < totalIds,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('art-proxy error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
