"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function useJerryThemeBootstrap() {
    const { setTheme } = useTheme();

    useEffect(() => {
        if (!window.jerry?.settings) return;

        void window.jerry.settings.get("theme").then((result) => {
            if (result.ok && (result.data === "light" || result.data === "dark")) {
                setTheme(result.data);
            }
        });
    }, [setTheme]);
}
