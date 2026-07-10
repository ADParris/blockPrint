import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu'; // Or whatever icon library you use
import { useTheme, type Theme } from '../hooks/useTheme';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <LuSun size={16} />, label: 'Light' },
    { value: 'system', icon: <LuMonitor size={16} />, label: 'System' },
    { value: 'dark', icon: <LuMoon size={16} />, label: 'Dark' },
  ];

  return (
    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all
            ${
              theme === option.value
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }
          `}
          title={option.label}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
