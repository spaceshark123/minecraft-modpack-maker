import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react"; // Lucide icons
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/components/ui/tooltip";

function ThemeToggle() {
	const [theme, setTheme] = useState<string>(() => {
		// Check the user's current theme from localStorage or default to "dark"
		return localStorage.getItem("theme") || "dark";
	});

	// Apply the theme to the html tag
	useEffect(() => {
		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(theme);
		// Save the theme to localStorage
		localStorage.setItem("theme", theme);
	}, [theme]);

	// Toggle function between light and dark
	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					className="absolute top-4 right-4 p-2 rounded-full w-12 h-12"
					variant="secondary"
					onClick={toggleTheme}
					aria-label="Toggle theme"
				>
					{theme === "light" ? (
						<Sun className="!h-6 !w-6" />
					) : (
						<Moon className="!h-6 !w-6" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>Toggle theme</TooltipContent>
		</Tooltip>

	);
}

export default ThemeToggle;