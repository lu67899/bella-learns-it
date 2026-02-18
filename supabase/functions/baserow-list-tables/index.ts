import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = Deno.env.get('BASEROW_API_TOKEN');
  if (!token) {
    return new Response(JSON.stringify({ error: 'BASEROW_API_TOKEN not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { table_id } = await req.json().catch(() => ({ table_id: null }));
    
    // Database tokens use TokenAuth header
    const authHeaders = { 'Authorization': `Token ${token}` };
    
    // If table_id provided, get fields and rows for that table
    if (table_id) {
      const [fieldsRes, rowsRes] = await Promise.all([
        fetch(`https://api.baserow.io/api/database/fields/table/${table_id}/`, { headers: authHeaders }),
        fetch(`https://api.baserow.io/api/database/rows/table/${table_id}/?size=3`, { headers: authHeaders })
      ]);
      
      const fieldsBody = await fieldsRes.text();
      const rowsBody = await rowsRes.text();
      
      console.log('Fields status:', fieldsRes.status);
      console.log('Rows status:', rowsRes.status);
      
      return new Response(JSON.stringify({
        table_id,
        fields_status: fieldsRes.status,
        fields: fieldsRes.status === 200 ? JSON.parse(fieldsBody) : fieldsBody,
        rows_status: rowsRes.status,
        rows: rowsRes.status === 200 ? JSON.parse(rowsBody) : rowsBody
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Try common table IDs to discover tables (brute force a small range)
    // This is a workaround since database tokens can't list workspaces
    const found: any[] = [];
    const testIds = Array.from({ length: 20 }, (_, i) => i + 1);
    
    const promises = testIds.map(async (id) => {
      try {
        const res = await fetch(`https://api.baserow.io/api/database/rows/table/${id}/?size=1`, {
          headers: authHeaders
        });
        if (res.status === 200) {
          const data = await res.json();
          const fieldsRes = await fetch(`https://api.baserow.io/api/database/fields/table/${id}/`, {
            headers: authHeaders
          });
          const fields = fieldsRes.status === 200 ? await fieldsRes.json() : [];
          found.push({
            table_id: id,
            row_count: data.count,
            fields: Array.isArray(fields) ? fields.map((f: any) => ({ id: f.id, name: f.name, type: f.type })) : [],
            sample: data.results?.[0] || null
          });
        } else {
          await res.text();
        }
      } catch {
        // skip
      }
    });
    
    await Promise.all(promises);
    
    // Also try higher ranges
    const highIds = [100, 200, 300, 400, 500, 1000, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000];
    const highPromises = highIds.map(async (baseId) => {
      for (let i = baseId; i < baseId + 5; i++) {
        try {
          const res = await fetch(`https://api.baserow.io/api/database/rows/table/${i}/?size=1`, {
            headers: authHeaders
          });
          if (res.status === 200) {
            const data = await res.json();
            const fieldsRes = await fetch(`https://api.baserow.io/api/database/fields/table/${i}/`, {
              headers: authHeaders
            });
            const fields = fieldsRes.status === 200 ? await fieldsRes.json() : [];
            found.push({
              table_id: i,
              row_count: data.count,
              fields: Array.isArray(fields) ? fields.map((f: any) => ({ id: f.id, name: f.name, type: f.type })) : [],
              sample: data.results?.[0] || null
            });
          } else {
            await res.text();
          }
        } catch {
          // skip
        }
      }
    });
    
    await Promise.all(highPromises);
    
    found.sort((a, b) => a.table_id - b.table_id);

    return new Response(JSON.stringify({
      message: found.length > 0 
        ? `Encontrei ${found.length} tabela(s)` 
        : 'Nenhuma tabela encontrada nos IDs testados. Por favor forneça o table_id manualmente.',
      token_type: 'database_token',
      tables: found
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
