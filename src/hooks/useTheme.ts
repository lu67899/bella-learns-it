import { useLocalStorage } from "./useLocalStorage";
import { useEffect } from "react";

export type ThemeName = "dark" | "pink" | "hogwarts";

const themeOrder: ThemeName[] = ["dark", "pink", "hogwarts"];

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeName>("bella-theme", "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  return { theme, setTheme, toggleTheme };
}
