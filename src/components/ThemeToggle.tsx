import { Moon, Sparkles, Wand2, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";

const themeIcons = {
  dark: { icon: Sparkles, label: "Tema Rosa" },
  pink: { icon: Wand2, label: "Tema Hogwarts" },
  hogwarts: { icon: CloudSun, label: "Tema Azul Céu" },
  sky: { icon: Moon, label: "Tema Escuro" },
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { icon: Icon, label } = themeIcons[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggleTheme}
      title={label}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    </Button>
  );
}
