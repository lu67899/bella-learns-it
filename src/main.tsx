import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalLogInterceptor } from "./lib/remoteLogger";

// Intercepta console.error/warn e salva no Supabase automaticamente
installGlobalLogInterceptor();


// Apply saved theme on load
const savedTheme = localStorage.getItem("bella-theme");
if (savedTheme) {
  document.documentElement.setAttribute("data-theme", JSON.parse(savedTheme));
}

createRoot(document.getElementById("root")!).render(<App />);
