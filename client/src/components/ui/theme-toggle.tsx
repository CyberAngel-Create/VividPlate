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
        {isDark ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
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
            {isDark ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            {showLabel && (isDark ? "Light Mode" : "Dark Mode")}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipPosition}>
          <p>Switch to {isDark ? "light" : "dark"} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}