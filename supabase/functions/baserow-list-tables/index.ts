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
    // List workspaces first
    const wsRes = await fetch('https://api.baserow.io/api/workspaces/', {
      headers: { 'Authorization': `Token ${token}` }
    });
    const wsBody = await wsRes.text();
    console.log('Workspaces response:', wsRes.status, wsBody);
    
    const workspaces = JSON.parse(wsBody);
    const results: any[] = [];

    for (const ws of workspaces) {
      // List apps in workspace
      const appsRes = await fetch(`https://api.baserow.io/api/applications/workspace/${ws.id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const apps = await appsRes.json();

      for (const app of apps) {
        if (app.type === 'database') {
          // List tables
          const tablesRes = await fetch(`https://api.baserow.io/api/database/tables/database/${app.id}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          const tables = await tablesRes.json();

          for (const table of tables) {
            // Get fields
            const fieldsRes = await fetch(`https://api.baserow.io/api/database/fields/table/${table.id}/`, {
              headers: { 'Authorization': `Token ${token}` }
            });
            const fields = await fieldsRes.json();

            // Get sample rows
            const rowsRes = await fetch(`https://api.baserow.io/api/database/rows/table/${table.id}/?size=2`, {
              headers: { 'Authorization': `Token ${token}` }
            });
            const rows = await rowsRes.json();

            results.push({
              workspace: ws.name,
              database: app.name,
              table_id: table.id,
              table_name: table.name,
              fields: Array.isArray(fields) ? fields.map((f: any) => ({ id: f.id, name: f.name, type: f.type })) : fields,
              sample_rows: rows.results?.slice(0, 2) || []
            });
          }
        }
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
