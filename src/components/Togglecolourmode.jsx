import { Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const Togglecolourmode = () => {
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    useEffect(() => {
        // Check if theme is stored in localStorage
        const storedTheme = localStorage.getItem('theme');
        const htmlElement = document.querySelector('html');

        // Check if user prefers dark mode
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Set initial theme based on stored preference or system preference
        if (storedTheme === 'dark' || (storedTheme === null && prefersDarkMode)) {
            htmlElement.classList.add('dark');
            setIsDarkTheme(true);
        } else {
            htmlElement.classList.remove('dark');
            setIsDarkTheme(false);
        }
    }, []);

    const toggleDarkMode = () => {
        const htmlElement = document.querySelector('html');

        setIsDarkTheme(prevMode => {
            const newMode = !prevMode;

            if (newMode) {
                // Enable dark mode
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                // Enable light mode
                htmlElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }

            return newMode;
        });
    };

    return (
        <button
            onClick={toggleDarkMode}
            id="theme-toggle"
            type="button"
            className="text-gray-500 dark:text-gray-400 cursor-pointer rounded-lg text-sm p-2.5"
            aria-label="Toggle dark mode"
        >
            {isDarkTheme ? (
                <Sun size={20} />
            ) : (
                <Moon size={20} />
            )}
        </button>
    );
};

export default Togglecolourmode;