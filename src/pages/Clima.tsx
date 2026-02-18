import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSun, Snowflake, CloudLightning, Wind, Droplets, Eye, Gauge, Sunrise, Sunset } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageContainer } from "@/components/PageContainer";
import BackButton from "@/components/BackButton";

interface DailyForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  icon: string;
  description: string;
  humidity: number;
  wind: number;
}

interface ForecastData {
  city: string;
  current: {
    temp: number;
    feels_like: number;
    description: string;
    icon: string;
    humidity: number;
    wind: number;
    pressure: number;
    visibility: number;
    sunrise: number;
    sunset: number;
  };
  daily: DailyForecast[];
}

const getWeatherIcon = (icon: string, size = "h-8 w-8") => {
  if (icon.includes("01")) return <Sun className={`${size} text-yellow-400`} />;
  if (icon.includes("02")) return <CloudSun className={`${size} text-yellow-300`} />;
  if (icon.includes("03") || icon.includes("04")) return <Cloud className={`${size} text-muted-foreground`} />;
  if (icon.includes("09") || icon.includes("10")) return <CloudRain className={`${size} text-blue-400`} />;
  if (icon.includes("11")) return <CloudLightning className={`${size} text-yellow-500`} />;
  if (icon.includes("13")) return <Snowflake className={`${size} text-blue-200`} />;
  return <Cloud className={`${size} text-muted-foreground`} />;
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === tomorrow.toDateString()) return "Amanhã";
  return format(date, "EEEE", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase());
};

const formatTime = (unix: number) => {
  const date = new Date(unix * 1000);
  return format(date, "HH:mm");
};

const Clima = () => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const CACHE_KEY = "forecast_cache";
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      } catch { /* ignore invalid cache */ }
    }

    const fetchForecast = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/weather?mode=forecast`,
          {
            headers: {
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
            },
          }
        );
        if (!res.ok) throw new Error("Forecast fetch failed");
        const forecastData = await res.json();
        setData(forecastData);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: forecastData, timestamp: Date.now() }));
      } catch (e) {
        console.error("Forecast fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <BackButton label="Voltar" />
          <h1 className="text-base font-bold">Previsão do Tempo</h1>
          <div className="animate-pulse space-y-3">
            <div className="h-40 bg-card rounded-xl" />
            <div className="h-24 bg-card rounded-xl" />
            <div className="h-64 bg-card rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <BackButton label="Voltar" />
          <h1 className="text-base font-bold">Previsão do Tempo</h1>
          <p className="text-muted-foreground text-sm">Não foi possível carregar a previsão.</p>
        </div>
      </PageContainer>
    );
  }

  return (
      <PageContainer>
        <div className="space-y-4 pb-6 w-full overflow-hidden">
          <BackButton label="Voltar" />
          <div>
            <h1 className="text-base font-bold">Previsão do Tempo</h1>
            <p className="text-xs text-muted-foreground font-mono">{data.city}</p>
          </div>

        {/* Current Weather Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card border border-border p-5 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4">
            {getWeatherIcon(data.current.icon, "h-14 w-14")}
            <div>
              <p className="text-4xl font-bold font-mono">{data.current.temp}°C</p>
              <p className="text-xs text-muted-foreground capitalize">{data.current.description}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Sensação de {data.current.feels_like}°C
              </p>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <DetailItem icon={<Droplets className="h-3.5 w-3.5" />} label="Umidade" value={`${data.current.humidity}%`} />
            <DetailItem icon={<Wind className="h-3.5 w-3.5" />} label="Vento" value={`${data.current.wind} km/h`} />
            <DetailItem icon={<Gauge className="h-3.5 w-3.5" />} label="Pressão" value={`${data.current.pressure} hPa`} />
            <DetailItem icon={<Eye className="h-3.5 w-3.5" />} label="Visibilidade" value={`${(data.current.visibility / 1000).toFixed(1)} km`} />
            <DetailItem icon={<Sunrise className="h-3.5 w-3.5" />} label="Nascer do sol" value={formatTime(data.current.sunrise)} />
            <DetailItem icon={<Sunset className="h-3.5 w-3.5" />} label="Pôr do sol" value={formatTime(data.current.sunset)} />
          </div>
        </motion.div>

        {/* 7-Day Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-card border border-border p-4"
        >
          <h2 className="text-sm font-semibold mb-3">Próximos dias</h2>
          <div className="space-y-1">
            {data.daily.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 gap-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getWeatherIcon(day.icon, "h-5 w-5 shrink-0")}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{getDayName(day.date)}</p>
                    <p className="text-[10px] text-muted-foreground capitalize truncate">{day.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono">{day.humidity}%</span>
                  </div>
                  <div className="flex gap-1 items-baseline font-mono">
                    <span className="text-xs font-semibold">{day.temp_max}°</span>
                    <span className="text-[10px] text-muted-foreground">{day.temp_min}°</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-2 min-w-0 overflow-hidden">
    <span className="text-muted-foreground shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
      <p className="text-xs font-mono font-medium truncate">{value}</p>
    </div>
  </div>
);

export default Clima;
