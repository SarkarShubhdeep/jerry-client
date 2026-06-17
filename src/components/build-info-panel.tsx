"use client";

import { useId } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BUILD_INFO_PANEL_ID = "jerry-build-info";

const INTRO_VIDEO_URL =
    "https://youtube.com/shorts/ew30nMNympY?si=h2oXmMP7JQYxsgHr";

const BETA_FEATURES = [
    "Chat with OpenAI — add your API key in Settings",
    "Work summaries from ActivityWatch (green AW badge)",
    "GitHub, docs, and other work links from the web watcher",
    "Model picker and Markdown replies",
    "Shared jerry-lib engine (same as Jerry CLI)",
] as const;

type BuildInfoPanelProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function BuildInfoPanel({ open, onOpenChange }: BuildInfoPanelProps) {
    const titleId = useId();

    if (!open) return null;

    return (
        <div
            id={BUILD_INFO_PANEL_ID}
            role="dialog"
            aria-labelledby={titleId}
            className="absolute top-full left-0 z-[60] mt-1 w-[min(100vw-2rem,17.5rem)] rounded-lg border bg-background/95 p-3 shadow-md backdrop-blur-sm"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
            <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                    <p
                        id={titleId}
                        className="text-sm font-medium leading-tight"
                    >
                        Jerry v0.2
                    </p>
                    <p className="text-muted-foreground text-xs">
                        macOS · local ActivityWatch + OpenAI
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0"
                    onClick={() => onOpenChange(false)}
                    aria-label="Close"
                >
                    <X className="size-3.5" aria-hidden="true" />
                </Button>
            </div>

            <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs leading-relaxed">
                {BETA_FEATURES.map((feature) => (
                    <li key={feature}>{feature}</li>
                ))}
            </ul>

            <a
                href={INTRO_VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary mt-3 inline-flex items-center gap-1 text-xs hover:underline"
            >
                Watch intro video
                <ExternalLink className="size-3" aria-hidden="true" />
            </a>
        </div>
    );
}
