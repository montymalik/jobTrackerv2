import { useState, useEffect } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // On mount, read the current theme from localStorage
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
    >
      {darkMode ? (
        <SunIcon className="h-6 w-6 text-yellow-500" />
      ) : (
        <MoonIcon className="h-6 w-6 text-gray-700" />
      )}
    </button>
  );
};

export default DarkModeToggle;

