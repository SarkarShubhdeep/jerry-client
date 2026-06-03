"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowUp, Loader2, Settings, Sparkles, Trash2 } from "lucide-react";
import { AwStatusBadge } from "@/components/aw-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ChatActivity,
    type ChatActivityStep,
} from "@/components/chat-activity";
import { ChatMarkdown } from "@/components/chat-markdown";
import { SettingsDialog } from "@/components/settings-dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { useJerryThemeBootstrap } from "@/hooks/use-jerry-settings";
import { useStickToBottom } from "@/hooks/use-stick-to-bottom";
import {
    DEFAULT_OPENAI_MODEL,
    getOpenAiModelLabel,
    OPENAI_MODEL_GROUPS,
    OPENAI_MODELS,
} from "@/lib/openai-models";
import { applyStatusUpdate } from "@/lib/chat-activity";
import { normalizeUserMessageContent } from "@/lib/chat-message";
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
        .map((item) => ({
            role: item.message.role,
            content: item.message.content,
        }));
}

export function ChatShell() {
    useJerryThemeBootstrap();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [openaiModel, setOpenaiModel] = useState(DEFAULT_OPENAI_MODEL);
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

    useEffect(() => {
        if (!window.jerry?.settings) return;
        void window.jerry.settings.get("openaiModel").then((result) => {
            if (
                result.ok &&
                OPENAI_MODELS.some((model) => model.id === result.data)
            ) {
                setOpenaiModel(result.data);
            }
        });
    }, []);

    const handleModelChange = async (model: string) => {
        setOpenaiModel(model);
        if (!window.jerry?.settings) return;
        await window.jerry.settings.set("openaiModel", model);
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

                    {/* Right: ActivityWatch status + Clear chat + Settings */}
                    <div
                        className="flex items-center gap-1"
                        style={
                            {
                                WebkitAppRegion: "no-drag",
                            } as React.CSSProperties
                        }
                    >
                        <AwStatusBadge />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 bg-background/90 backdrop-blur-sm"
                            onClick={clearChat}
                            disabled={thread.length === 0}
                            aria-label="Clear chat"
                        >
                            <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 bg-background/90 backdrop-blur-sm"
                            onClick={() => setSettingsOpen(true)}
                            aria-label="Settings"
                        >
                            <Settings className="size-4" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </div>

            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />

            <div
                ref={scrollContainerRef}
                className="min-h-0 flex-1 overflow-y-auto pt-12"
            >
                <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
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
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <p className="text-muted-foreground text-xs font-medium uppercase">
                                            {msg.role === "user"
                                                ? "You"
                                                : "Jerry"}
                                        </p>
                                        {msg.role === "assistant" && msg.model && (
                                            <Badge
                                                variant="outline"
                                                className="font-mono text-[10px] font-normal normal-case"
                                                title={
                                                    msg.api
                                                        ? `OpenAI ${msg.api} API`
                                                        : undefined
                                                }
                                            >
                                                {getOpenAiModelLabel(msg.model)}{" "}
                                                <span className="text-muted-foreground">
                                                    ({msg.model}
                                                    {msg.api
                                                        ? ` · ${msg.api}`
                                                        : ""}
                                                    )
                                                </span>
                                            </Badge>
                                        )}
                                    </div>
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

            <footer className="shrink-0 space-y-2 bg-background/90 p-3 backdrop-blur-sm">
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
                <div className="mx-auto flex max-w-lg items-center justify-end gap-2">
                    <span className="text-muted-foreground text-xs">
                        Next message uses
                    </span>
                    <Select
                        value={openaiModel}
                        onValueChange={(value) => void handleModelChange(value)}
                        disabled={chatLoading}
                    >
                        <SelectTrigger
                            size="sm"
                            className="h-7 border-0 bg-transparent text-muted-foreground shadow-none"
                            aria-label="OpenAI model for next message"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end" className="max-h-72">
                            {OPENAI_MODEL_GROUPS.map((group) => (
                                <SelectGroup key={group.label}>
                                    <SelectLabel>{group.label}</SelectLabel>
                                    {group.models.map((model) => (
                                        <SelectItem
                                            key={model.id}
                                            value={model.id}
                                        >
                                            {model.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </footer>
        </div>
    );
}
