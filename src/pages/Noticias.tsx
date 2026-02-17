import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, ExternalLink, Monitor, Gamepad2, Film, Tv, Trophy } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

const CATEGORIES = [
  { id: "tecnologia", label: "Tech", icon: Monitor },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "filmes", label: "Filmes", icon: Film },
  { id: "series", label: "Séries", icon: Tv },
  { id: "esportes", label: "Esportes", icon: Trophy },
  { id: "tv", label: "TV", icon: Newspaper },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const Noticias = () => {
  const [activeTab, setActiveTab] = useState("tecnologia");
  const [news, setNews] = useState<Record<string, NewsItem[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchCategory = async (category: string) => {
    if (news[category]) return;
    setLoading((prev) => ({ ...prev, [category]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("fetch-news", {
        body: { category },
      });
      if (error) throw error;
      if (data?.success) {
        setNews((prev) => ({ ...prev, [category]: data.data }));
      }
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  useEffect(() => {
    fetchCategory(activeTab);
  }, [activeTab]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <BackButton to="/" />
          <div className="flex items-center gap-2 mb-1 mt-3">
            <Newspaper className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold font-mono">Notícias</h1>
          </div>
          <p className="text-sm text-muted-foreground">Fique por dentro do que está rolando</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5 text-xs">
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-4">
              {loading[cat.id] ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="p-4 animate-pulse bg-card border-border">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </Card>
                  ))}
                </div>
              ) : !news[cat.id] || news[cat.id].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Nenhuma notícia encontrada.</p>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                  {news[cat.id].map((n, idx) => (
                    <motion.div key={idx} variants={item}>
                      <a href={n.link} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => { e.preventDefault(); window.open(n.link, '_blank'); }}>
                        <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all group cursor-pointer">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-sm font-medium group-hover:text-primary transition-colors">
                                {n.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                {n.source && (
                                  <span className="text-[10px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
                                    {n.source}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(n.pubDate)}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Card>
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Noticias;
