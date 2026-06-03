"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
    Activity,
    ArrowUp,
    Loader2,
    Moon,
    RefreshCw,
    Settings,
    Sparkles,
    Sun,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ChatActivity,
    type ChatActivityStep,
} from "@/components/chat-activity";
import { ChatMarkdown } from "@/components/chat-markdown";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { useStickToBottom } from "@/hooks/use-stick-to-bottom";
import { applyStatusUpdate } from "@/lib/chat-activity";
import { normalizeUserMessageContent } from "@/lib/chat-message";
import type { AwActivitySummary, IpcResult } from "@/types/activitywatch";
import type { ChatMessage } from "@/types/llm";

type ThreadItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "activity"; steps: ChatActivityStep[] };

function threadToMessages(thread: ThreadItem[]): ChatMessage[] {
    return thread
        .filter(
            (item): item is { kind: "message"; message: ChatMessage } =>
                item.kind === "message",
        )
        .map((item) => item.message);
}

type RangePreset = "5h" | "today";

function hoursForPreset(preset: RangePreset): number {
    if (preset === "5h") return 5;
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return (now.getTime() - start.getTime()) / (60 * 60 * 1000);
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });
}

export function ChatShell() {
    const { theme, setTheme } = useTheme();
    const [preset, setPreset] = useState<RangePreset>("5h");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<AwActivitySummary | null>(null);
    const [thread, setThread] = useState<ThreadItem[]>([]);
    const [liveActivity, setLiveActivity] = useState<ChatActivityStep[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const { textareaRef } = useAutoResizeTextarea(draft);
    const {
        containerRef: scrollContainerRef,
        scrollToBottom,
        stickToBottomRef,
    } = useStickToBottom();

    useLayoutEffect(() => {
        scrollToBottom(thread.length === 0 ? "auto" : "smooth");
    }, [thread, liveActivity, chatLoading, chatError, scrollToBottom]);

    const fetchActivity = useCallback(async () => {
        if (!window.jerry?.aw) {
            setError(
                "ActivityWatch API is only available in the Electron app.",
            );
            return;
        }

        setLoading(true);
        setError(null);

        const result: IpcResult<AwActivitySummary> =
            await window.jerry.aw.fetchActivity(hoursForPreset(preset));

        setLoading(false);

        if (!result.ok) {
            setSummary(null);
            setError(result.error);
            return;
        }

        setSummary(result.data);
    }, [preset]);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const sendMessage = useCallback(async () => {
        const text = draft.trim();
        if (!text || chatLoading) return;

        if (!window.jerry?.llm) {
            setChatError("Chat is only available in the Electron app.");
            return;
        }

        const userMessage: ChatMessage = {
            role: "user",
            content: normalizeUserMessageContent(text),
        };
        const nextMessages = [...threadToMessages(thread), userMessage];
        stickToBottomRef.current = true;
        setThread((prev) => [
            ...prev,
            { kind: "message", message: userMessage },
        ]);
        setDraft("");
        setChatLoading(true);
        setChatError(null);
        setLiveActivity([]);

        let activitySnapshot: ChatActivityStep[] = [];
        const result = await window.jerry.llm.chat(nextMessages, (update) => {
            setLiveActivity((prev) => {
                const next = applyStatusUpdate(prev, update);
                activitySnapshot = next;
                return next;
            });
        });
        setChatLoading(false);
        setLiveActivity([]);

        if (!result.ok) {
            setChatError(result.error);
            return;
        }

        const activitySteps = activitySnapshot.map((s) => ({
            ...s,
            state: "done" as const,
        }));
        setThread((prev) => [
            ...prev,
            ...(activitySteps.length > 0
                ? [{ kind: "activity" as const, steps: activitySteps }]
                : []),
            { kind: "message", message: result.data.message },
        ]);
    }, [chatLoading, draft, stickToBottomRef, thread]);

    const clearChat = () => {
        setThread([]);
        setLiveActivity([]);
        setChatError(null);
    };

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-background/80">
            {/* Floating controls - positioned in the draggable title bar area */}
            <div
                className="fixed inset-x-0 top-0 z-50 p-3 pt-2"
                style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
            >
                <div className="flex items-start justify-between">
                    {/* Left: Jerry badge */}
                    <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm ml-16"
                        style={
                            {
                                WebkitAppRegion: "no-drag",
                            } as React.CSSProperties
                        }
                    >
                        <Sparkles className="size-3.5" aria-hidden="true" />
                        Jerry
                    </Badge>

                    {/* Right: Settings dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 bg-background/90 backdrop-blur-sm"
                                style={
                                    {
                                        WebkitAppRegion: "no-drag",
                                    } as React.CSSProperties
                                }
                                aria-label="Settings"
                            >
                                <Settings
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={toggleTheme}>
                                {theme === "dark" ? (
                                    <>
                                        <Sun
                                            className="mr-2 size-4"
                                            aria-hidden="true"
                                        />
                                        Light mode
                                    </>
                                ) : (
                                    <>
                                        <Moon
                                            className="mr-2 size-4"
                                            aria-hidden="true"
                                        />
                                        Dark mode
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={clearChat}
                                disabled={thread.length === 0}
                            >
                                <Trash2
                                    className="mr-2 size-4"
                                    aria-hidden="true"
                                />
                                Clear chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="min-h-0 flex-1 overflow-y-auto pt-12"
            >
                <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
                    <Card className="bg-card/80 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <Activity
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                ActivityWatch
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        preset === "5h" ? "default" : "outline"
                                    }
                                    onClick={() => setPreset("5h")}
                                >
                                    Last 5 hours
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        preset === "today"
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => setPreset("today")}
                                >
                                    Today
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={fetchActivity}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2
                                            className="size-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <RefreshCw
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                    Fetch watchers
                                </Button>
                            </div>

                            {error && (
                                <p
                                    className="text-destructive text-sm"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            {summary && (
                                <div className="space-y-2 text-sm">
                                    <p className="text-muted-foreground">
                                        {summary.bucketCount} buckets ·{" "}
                                        {summary.rangeHours < 1
                                            ? "under 1 hour"
                                            : `${Math.round(summary.rangeHours * 10) / 10}h`}{" "}
                                        window ·{" "}
                                        {formatTime(summary.range.start)} –{" "}
                                        {formatTime(summary.range.end)}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {summary.totalEventCount.toLocaleString()}{" "}
                                        events · {summary.totalApiCalls} API
                                        call
                                        {summary.totalApiCalls === 1
                                            ? ""
                                            : "s"}{" "}
                                        (1,000 per page)
                                    </p>
                                    {summary.afk && (
                                        <p>
                                            AFK:{" "}
                                            <span className="font-medium">
                                                {summary.afk.status}
                                            </span>{" "}
                                            <span className="text-muted-foreground">
                                                (
                                                {formatTime(
                                                    summary.afk.timestamp,
                                                )}
                                                )
                                            </span>
                                        </p>
                                    )}
                                    <ul className="space-y-1.5">
                                        {summary.latest.map((item) => (
                                            <li
                                                key={item.watcher}
                                                className="rounded-md border bg-background/50 px-2 py-1.5"
                                            >
                                                <span className="text-muted-foreground uppercase text-xs">
                                                    {item.watcher}
                                                </span>
                                                <p className="font-medium truncate">
                                                    {item.app}
                                                </p>
                                                {item.title &&
                                                    item.watcher !== "afk" && (
                                                        <p className="text-muted-foreground truncate text-xs">
                                                            {item.title}
                                                        </p>
                                                    )}
                                                <p className="text-muted-foreground text-xs">
                                                    {formatTime(item.timestamp)}{" "}
                                                    ·{" "}
                                                    {(
                                                        summary.eventCounts[
                                                            item.watcher
                                                        ] ?? 0
                                                    ).toLocaleString()}{" "}
                                                    events
                                                    {(summary.eventFetchPages[
                                                        item.watcher
                                                    ] ?? 1) > 1 &&
                                                        ` · ${summary.eventFetchPages[item.watcher]} pages`}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-3" role="log" aria-live="polite">
                        {thread.length === 0 && !chatLoading && (
                            <p className="rounded-lg border border-dashed bg-background/50 p-6 text-center text-muted-foreground text-sm">
                                Ask Jerry anything. Use{" "}
                                <span className="font-mono"># Title</span> for a
                                topic; Markdown is supported. Shift+Enter for a
                                new line.
                            </p>
                        )}
                        {thread.map((item, index) => {
                            if (item.kind === "activity") {
                                return (
                                    <ChatActivity
                                        key={`activity-${index}-${item.steps.map((s) => s.phase).join("-")}`}
                                        steps={item.steps}
                                    />
                                );
                            }
                            const msg = item.message;
                            return (
                                <div
                                    key={`${msg.role}-${index}-${msg.content.slice(0, 24)}`}
                                    className={`rounded-lg border px-3 py-2 text-sm ${
                                        msg.role === "user"
                                            ? "ml-8 border-primary/20 bg-primary/5"
                                            : "mr-8 bg-background/50"
                                    }`}
                                >
                                    <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                                        {msg.role === "user" ? "You" : "Jerry"}
                                    </p>
                                    <ChatMarkdown content={msg.content} />
                                </div>
                            );
                        })}
                        {chatLoading && liveActivity.length > 0 && (
                            <ChatActivity steps={liveActivity} />
                        )}
                        {chatLoading && liveActivity.length === 0 && (
                            <div className="mr-8 flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-muted-foreground text-sm">
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                                Thinking…
                            </div>
                        )}
                        {chatError && (
                            <p
                                className="text-destructive text-sm"
                                role="alert"
                            >
                                {chatError}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <footer className="shrink-0 bg-background/90 backdrop-blur-sm p-3">
                <div className="mx-auto flex max-w-lg items-center gap-2 rounded-2xl border bg-background px-3 py-2">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Ask Jerry..."
                        value={draft}
                        rows={1}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void sendMessage();
                            }
                        }}
                        disabled={chatLoading}
                        aria-label="Message"
                        className="min-h-5 flex-1 resize-none border-0 bg-transparent p-0 leading-5 shadow-none focus-visible:ring-0"
                    />
                    <Button
                        type="button"
                        size="icon"
                        disabled={chatLoading || !draft.trim()}
                        onClick={() => void sendMessage()}
                        aria-label="Send message"
                        className="size-8 shrink-0 self-end rounded-full"
                    >
                        {chatLoading ? (
                            <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                        ) : (
                            <ArrowUp className="size-4" aria-hidden="true" />
                        )}
                    </Button>
                </div>
            </footer>
        </div>
    );
}
