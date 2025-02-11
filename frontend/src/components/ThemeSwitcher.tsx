import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setTheme } from "../../redux/slices/preferencesSlice";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false); // Ensure hydration consistency
  const [clicked, setClicked] = useState(false); // For animation trigger
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.preferences.theme);

  // Set theme only after hydration
  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setClicked(true);
    const newTheme = theme === "light" ? "dark" : "light";
    dispatch(setTheme(newTheme)); // Redux updates localStorage
    setTimeout(() => setClicked(false), 600); // Reset animation
  };

  // Prevent rendering on the server (fixes hydration mismatch)
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md hover:scale-110 transition-transform duration-300
      ${theme === "light" ? "bg-dark-background text-dark-button-text" : "bg-light-background text-light-button-text"}`}
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <MoonIcon className={`w-6 h-6 text-dark-primary-button ${clicked ? "animate-spinEase" : ""}`} />
      ) : (
        <SunIcon className={`w-6 h-6 text-light-secondary-button ${clicked ? "animate-spinEase" : ""}`} />
      )}
    </button>
  );
};

export default ThemeSwitcher;
