import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThemeToggleProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = "outline", 
  size = "icon", 
  tooltipPosition = "bottom",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  // Using state to handle the mounted check to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";
  
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // Basic rendering without tooltip if not needed
  if (!showLabel) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <div className="relative w-[1.2rem] h-[1.2rem]">
          <Sun className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`} />
          <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0'}`} />
        </div>
      </Button>
    );
  }

  // With tooltip for better UX
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            className="gap-2"
          >
            <div className="relative w-[1.2rem] h-[1.2rem]">
              <Sun className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`} />
              <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0'}`} />
            </div>
            {showLabel && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipPosition}>
          <p>Switch to {isDark ? "light" : "dark"} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}