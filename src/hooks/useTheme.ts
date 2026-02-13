import { useLocalStorage } from "./useLocalStorage";
import { useEffect } from "react";

export type ThemeName = "dark" | "pink";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeName>("bella-theme", "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "pink" : "dark");

  return { theme, setTheme, toggleTheme };
}
