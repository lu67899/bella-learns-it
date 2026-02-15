const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

function parseRSSItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const source = itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || '';

    if (title && link) {
      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link,
        pubDate,
        source: source.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      });
    }
  }

  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return items.slice(0, 15);
}

const CATEGORY_QUERIES: Record<string, string> = {
  tecnologia: 'tecnologia',
  games: 'games+jogos',
  filmes: 'filmes+cinema',
  series: 'séries+streaming',
  esportes: 'esportes+futebol',
  tv: 'televisão+TV+entretenimento',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();
    const query = CATEGORY_QUERIES[category] || 'tecnologia';

    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    console.log('Fetching RSS:', rssUrl);

    const response = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRSSItems(xml);

    console.log(`Found ${items.length} items for category: ${category}`);

    return new Response(
      JSON.stringify({ success: true, data: items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch news' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
