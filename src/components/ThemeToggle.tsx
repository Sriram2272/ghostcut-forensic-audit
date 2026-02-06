import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center">
        <Sun className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-all group"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-warning transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-primary transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
