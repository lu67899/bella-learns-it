import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";

interface BackButtonProps {
  to?: string;
  label?: string;
  onClick?: () => void;
  openMenu?: boolean;
}

const BackButton = ({ to, label = "Voltar", onClick, openMenu }: BackButtonProps) => {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (openMenu) {
      setOpenMobile(true);
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors duration-200 py-1.5"
    >
      <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-secondary/80 group-hover:bg-primary/15 group-hover:text-primary transition-all duration-200">
        <ArrowLeft className="h-3.5 w-3.5" />
      </span>
      {label && <span className="text-xs tracking-wide">{label}</span>}
    </button>
  );
};

export default BackButton;
