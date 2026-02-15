import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppFeatures {
  musicEnabled: boolean;
  newsEnabled: boolean;
}

interface AppFeaturesContextType {
  features: AppFeatures;
  loading: boolean;
}

const AppFeaturesContext = createContext<AppFeaturesContextType>({
  features: { musicEnabled: true, newsEnabled: true },
  loading: true,
});

export const useAppFeatures = () => useContext(AppFeaturesContext);

export function AppFeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<AppFeatures>({ musicEnabled: true, newsEnabled: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      const { data } = await supabase.from("app_features").select("*").limit(1).single();
      if (data) {
        setFeatures({
          musicEnabled: data.music_enabled,
          newsEnabled: data.news_enabled,
        });
      }
      setLoading(false);
    };
    fetchFeatures();
  }, []);

  return (
    <AppFeaturesContext.Provider value={{ features, loading }}>
      {children}
    </AppFeaturesContext.Provider>
  );
}
