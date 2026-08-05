interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ darkMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="min-h-11 rounded-md border border-primary-100 bg-white px-4 py-2 text-sm font-bold text-primary-700 shadow-sm transition hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gold-400 dark:hover:bg-slate-700"
    >
      {darkMode ? "Light mode" : "Dark mode"}
    </button>
  );
}
