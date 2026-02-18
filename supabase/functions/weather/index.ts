import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// City coordinates map (common Brazilian cities)
const cityCoords: Record<string, { lat: number; lon: number }> = {
  "rio de janeiro": { lat: -22.9068, lon: -43.1729 },
  "são paulo": { lat: -23.5505, lon: -46.6333 },
  "belo horizonte": { lat: -19.9167, lon: -43.9345 },
  "brasília": { lat: -15.7975, lon: -47.8919 },
  "salvador": { lat: -12.9714, lon: -38.5124 },
  "curitiba": { lat: -25.4284, lon: -49.2733 },
  "fortaleza": { lat: -3.7172, lon: -38.5433 },
  "recife": { lat: -8.0476, lon: -34.877 },
  "porto alegre": { lat: -30.0346, lon: -51.2177 },
  "manaus": { lat: -3.119, lon: -60.0217 },
  "belém": { lat: -1.4558, lon: -48.5024 },
  "goiânia": { lat: -16.6869, lon: -49.2648 },
  "campinas": { lat: -22.9099, lon: -47.0626 },
  "florianópolis": { lat: -27.5954, lon: -48.548 },
  "vitória": { lat: -20.3155, lon: -40.3128 },
  "natal": { lat: -5.7945, lon: -35.211 },
  "maceió": { lat: -9.6658, lon: -35.7353 },
  "joão pessoa": { lat: -7.115, lon: -34.861 },
  "teresina": { lat: -5.0892, lon: -42.8019 },
  "campo grande": { lat: -20.4697, lon: -54.6201 },
  "cuiabá": { lat: -15.6014, lon: -56.0979 },
  "aracaju": { lat: -10.9091, lon: -37.0677 },
  "niterói": { lat: -22.8833, lon: -43.1036 },
  "santos": { lat: -23.9608, lon: -46.3336 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "current"; // "current" or "forecast"

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get API key from admin_config first, fallback to env
    const { data: adminConfig } = await supabase
      .from("admin_config")
      .select("weather_api_key")
      .eq("id", 1)
      .single();

    const apiKey = (adminConfig as any)?.weather_api_key || Deno.env.get("OPENWEATHERMAP_API_KEY");
    if (!apiKey) {
      throw new Error("Weather API key not configured");
    }

    // Get user city from profile via auth token
    let userCity: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("cidade")
          .eq("user_id", user.id)
          .single();
        if ((profile as any)?.cidade) {
          userCity = (profile as any).cidade.toLowerCase().trim();
        }
      }
    }

    // Resolve coordinates
    let lat = -22.9068;
    let lon = -43.1729;
    let cityName = "Rio de Janeiro";

    if (userCity && cityCoords[userCity]) {
      lat = cityCoords[userCity].lat;
      lon = cityCoords[userCity].lon;
      cityName = userCity.charAt(0).toUpperCase() + userCity.slice(1);
    } else if (userCity) {
      try {
        const geoRes = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(userCity)},BR&limit=1&appid=${apiKey}`
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          lat = geoData[0].lat;
          lon = geoData[0].lon;
          cityName = geoData[0].name;
        }
      } catch {
        // fallback to Rio
      }
    }

    if (mode === "forecast") {
      // 7-day forecast using One Call API 3.0 or fallback to 5-day/3h forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br&cnt=56`
      );

      if (!forecastRes.ok) {
        throw new Error(`OpenWeatherMap forecast error: ${forecastRes.status}`);
      }

      const forecastData = await forecastRes.json();

      // Also get current weather
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`
      );
      const currentData = await currentRes.json();

      // Group forecast by day
      const dailyMap: Record<string, any> = {};
      for (const item of forecastData.list) {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyMap[date]) {
          dailyMap[date] = {
            date,
            temps: [],
            icons: [],
            descriptions: [],
            humidity: [],
            wind: [],
          };
        }
        dailyMap[date].temps.push(item.main.temp);
        dailyMap[date].icons.push(item.weather[0].icon);
        dailyMap[date].descriptions.push(item.weather[0].description);
        dailyMap[date].humidity.push(item.main.humidity);
        dailyMap[date].wind.push(item.wind.speed);
      }

      const daily = Object.values(dailyMap).slice(0, 7).map((day: any) => ({
        date: day.date,
        temp_min: Math.round(Math.min(...day.temps)),
        temp_max: Math.round(Math.max(...day.temps)),
        icon: day.icons[Math.floor(day.icons.length / 2)], // midday icon
        description: day.descriptions[Math.floor(day.descriptions.length / 2)],
        humidity: Math.round(day.humidity.reduce((a: number, b: number) => a + b, 0) / day.humidity.length),
        wind: Math.round((day.wind.reduce((a: number, b: number) => a + b, 0) / day.wind.length) * 3.6),
      }));

      const result = {
        city: cityName,
        current: {
          temp: Math.round(currentData.main.temp),
          feels_like: Math.round(currentData.main.feels_like),
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          humidity: currentData.main.humidity,
          wind: Math.round(currentData.wind.speed * 3.6),
          pressure: currentData.main.pressure,
          visibility: currentData.visibility,
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset,
        },
        daily,
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Current weather (default)
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`
    );

    if (!res.ok) {
      throw new Error(`OpenWeatherMap error: ${res.status}`);
    }

    const data = await res.json();

    const weather = {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6),
      city: cityName,
    };

    return new Response(JSON.stringify(weather), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Weather error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
