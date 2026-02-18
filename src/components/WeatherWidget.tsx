import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSun, Snowflake, CloudLightning, Wind, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  city?: string;
}

const getWeatherIcon = (icon: string) => {
  if (icon.includes("01")) return <Sun className="h-7 w-7 text-yellow-400" />;
  if (icon.includes("02")) return <CloudSun className="h-7 w-7 text-yellow-300" />;
  if (icon.includes("03") || icon.includes("04")) return <Cloud className="h-7 w-7 text-muted-foreground" />;
  if (icon.includes("09") || icon.includes("10")) return <CloudRain className="h-7 w-7 text-blue-400" />;
  if (icon.includes("11")) return <CloudLightning className="h-7 w-7 text-yellow-500" />;
  if (icon.includes("13")) return <Snowflake className="h-7 w-7 text-blue-200" />;
  return <Cloud className="h-7 w-7 text-muted-foreground" />;
};

const getStudyTip = (temp: number, icon: string): string => {
  if (icon.includes("09") || icon.includes("10")) return "Dia de chuva = dia perfeito pra estudar! 📚";
  if (temp > 32) return "Tá quente! Estude num lugar fresquinho 🧊";
  if (temp < 18) return "Friozinho bom pra focar nos estudos ☕";
  if (icon.includes("01")) return "Dia lindo! Que tal estudar ao ar livre? 🌿";
  return "Clima agradável, bora estudar! 💪";
};

interface WeatherWidgetProps {
  frases?: string[];
  fraseIdx?: number;
}

export const WeatherWidget = ({ frases = [], fraseIdx = 0 }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const CACHE_KEY = "weather_cache";
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setWeather(cachedData);
          setLoading(false);
          return;
        }
      } catch { /* ignore invalid cache */ }
    }

    const fetchWeather = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("weather");
        if (error) throw error;
        setWeather(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {
        console.error("Weather fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-card border border-border p-4 animate-pulse">
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (!weather) return null;

  const displayText = frases.length > 0 ? frases[fraseIdx] : getStudyTip(weather.temp, weather.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/clima")}
      className="rounded-xl bg-card border border-border p-4 overflow-hidden relative cursor-pointer hover:border-primary/30 transition-colors"
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/5 blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.icon)}
          <div>
            <p className="text-2xl font-bold font-mono">{weather.temp}°C</p>
            <p className="text-[10px] text-muted-foreground capitalize">{weather.description}</p>
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 justify-end">
            <Droplets className="h-3 w-3" /> {weather.humidity}%
          </p>
          <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 justify-end">
            <Wind className="h-3 w-3" /> {weather.wind} km/h
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 gap-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={frases.length > 0 ? fraseIdx : "tip"}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.4 }}
            className="text-[10px] text-muted-foreground tracking-wide truncate italic"
          >
            {displayText}
          </motion.p>
        </AnimatePresence>
        <span className="text-[9px] text-muted-foreground/40 font-mono whitespace-nowrap">{weather.city || "Rio de Janeiro"}</span>
      </div>
    </motion.div>
  );
};
