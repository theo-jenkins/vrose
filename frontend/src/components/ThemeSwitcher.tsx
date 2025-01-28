import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState("light");
  const [clicked, setClicked] = useState(false); // Track if the button was clicked

  // Load saved theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  // Toggle theme and update localStorage
  const toggleTheme = () => {
    setClicked(true); // Set clicked to true on button click
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
    setTimeout(() => setClicked(false), 600); // Reset clicked after animation duration
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full shadow-md hover:scale-110 transition-transform duration-300"
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <MoonIcon
          className={`w-6 h-6 text-gray-800 ${
            clicked ? "animate-spinEase" : ""
          }`}
        />
      ) : (
        <SunIcon
          className={`w-6 h-6 text-yellow-400 ${
            clicked ? "animate-spinEase" : ""
          }`}
        />
      )}
    </button>
  );
};

export default ThemeSwitcher;
