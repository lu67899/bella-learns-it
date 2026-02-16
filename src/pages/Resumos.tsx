import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Resumo {
  id: string;
  materia: string;
  titulo: string;
  conteudo: string;
}

const Resumos = () => {
  const [resumos, setResumos] = useState<Resumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");
  const { toast } = useToast();

  useEffect(() => {
    const fetchResumos = async () => {
      const { data, error } = await supabase.from("resumos").select("*").order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar resumos", variant: "destructive" });
      } else {
        setResumos(data || []);
      }
      setLoading(false);
    };
    fetchResumos();
  }, []);

  const materias = [...new Set(resumos.map((r) => r.materia))];

  const filtrados = resumos.filter((r) => {
    const matchBusca = r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      r.conteudo.toLowerCase().includes(busca.toLowerCase());
    const matchMateria = materiaFiltro === "todas" || r.materia === materiaFiltro;
    return matchBusca && matchMateria;
  });

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Resumos
          </h1>
          <p className="text-sm text-muted-foreground">Seus resumos de estudo</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por tema..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={materiaFiltro} onValueChange={setMateriaFiltro}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as matérias</SelectItem>
              {materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum resumo encontrado</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtrados.map((r) => (
              <Link key={r.id} to={`/resumos/${r.id}`}>
                <Card className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <Badge variant="outline" className="mb-2 text-xs text-primary border-primary/30">{r.materia}</Badge>
                    <h3 className="font-mono font-semibold mb-2 group-hover:text-primary transition-colors">{r.titulo}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.conteudo.slice(0, 120)}...</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Resumos;
