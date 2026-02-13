import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMaterias() {
  const [materias, setMaterias] = useState<string[]>([]);

  const load = async () => {
    const { data } = await supabase.from("materias").select("nome").order("nome");
    if (data) setMaterias(data.map((m: any) => m.nome));
  };

  useEffect(() => { load(); }, []);

  return { materias, reload: load };
}
