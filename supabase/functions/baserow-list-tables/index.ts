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
    const authHeaders = { 'Authorization': `Token ${token}` };
    
    // Debug: test token by listing workspaces
    if (!table_id) {
      const wsRes = await fetch('https://api.baserow.io/api/workspaces/', { headers: authHeaders });
      const wsBody = await wsRes.text();
      if (wsRes.status !== 200) {
        return new Response(JSON.stringify({ 
          error: 'Token test failed', 
          status: wsRes.status, 
          body: wsBody,
          hint: 'Use a Personal API Token from Settings > Account > API Token (not a Database Token)'
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // If table_id provided, get fields and rows for that table
    if (table_id) {
      const [fieldsRes, rowsRes] = await Promise.all([
        fetch(`https://api.baserow.io/api/database/fields/table/${table_id}/`, { headers: authHeaders }),
        fetch(`https://api.baserow.io/api/database/rows/table/${table_id}/?size=3`, { headers: authHeaders })
      ]);
      
      const fieldsBody = await fieldsRes.text();
      const rowsBody = await rowsRes.text();
      
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

    // List all tables in the known database (204452)
    const dbId = 204452;
    const tablesRes = await fetch(`https://api.baserow.io/api/database/tables/database/${dbId}/`, { headers: authHeaders });
    
    if (tablesRes.status === 200) {
      const tables = await tablesRes.json();
      const detailed = await Promise.all(tables.map(async (t: any) => {
        const fRes = await fetch(`https://api.baserow.io/api/database/fields/table/${t.id}/`, { headers: authHeaders });
        const fields = fRes.status === 200 ? await fRes.json() : [];
        return {
          table_id: t.id,
          name: t.name,
          order: t.order,
          fields: Array.isArray(fields) ? fields.map((f: any) => ({ id: f.id, name: f.name, type: f.type })) : []
        };
      }));
      return new Response(JSON.stringify({ database_id: dbId, tables: detailed }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const tablesBody = await tablesRes.text();
    return new Response(JSON.stringify({ error: 'Could not list tables', status: tablesRes.status, body: tablesBody }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
