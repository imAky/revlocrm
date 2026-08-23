"use client";

import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors ${className}`}
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-500 transition-all hover:-rotate-12" />
      )}
    </Button>
  );
}
